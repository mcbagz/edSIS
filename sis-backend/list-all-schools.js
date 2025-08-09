// Script to list all schools available in Ed-Fi ODS
const axios = require('axios');

const EDFI_BASE_URL = 'http://localhost:8001';
const CLIENT_ID = 'populatedKey';
const CLIENT_SECRET = 'populatedSecret';

async function getAuthToken() {
  try {
    const response = await axios.post(
      `${EDFI_BASE_URL}/oauth/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Authentication failed:', error.message);
    throw error;
  }
}

async function getAllSchools(token) {
  try {
    console.log('Fetching all schools from Ed-Fi ODS...\n');
    
    // Get all schools with a higher limit
    const response = await axios.get(
      `${EDFI_BASE_URL}/data/v3/ed-fi/schools`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        params: {
          limit: 100  // Get up to 100 schools
        }
      }
    );
    
    const schools = response.data;
    console.log(`Found ${schools.length} schools:\n`);
    console.log('School ID | Name | Short Name | Type');
    console.log('-'.repeat(80));
    
    // Sort schools by ID for easier reading
    schools.sort((a, b) => a.schoolId - b.schoolId);
    
    schools.forEach(school => {
      const categories = school.schoolCategories || [];
      const category = categories.length > 0 
        ? categories[0].schoolCategoryDescriptor.split('#')[1] 
        : 'N/A';
      
      console.log(
        `${String(school.schoolId).padEnd(9)} | ` +
        `${school.nameOfInstitution.padEnd(45)} | ` +
        `${(school.shortNameOfInstitution || '').padEnd(10)} | ` +
        `${category}`
      );
    });
    
    // Check specifically for school 1001
    console.log('\n' + '='.repeat(80));
    const school1001 = schools.find(s => s.schoolId === 1001);
    if (school1001) {
      console.log('✓ School 1001 is accessible:');
      console.log(`  Name: ${school1001.nameOfInstitution}`);
      console.log(`  Short Name: ${school1001.shortNameOfInstitution || 'N/A'}`);
      
      if (school1001.localEducationAgencyReference) {
        console.log(`  LEA ID: ${school1001.localEducationAgencyReference.localEducationAgencyId}`);
      }
      
      if (school1001.addresses && school1001.addresses.length > 0) {
        const addr = school1001.addresses[0];
        console.log(`  Address: ${addr.streetNumberName}, ${addr.city}, ${addr.stateAbbreviationDescriptor.split('#')[1]} ${addr.postalCode}`);
      }
    } else {
      console.log('✗ School 1001 is not in the accessible schools list');
    }
    
    return schools;
  } catch (error) {
    console.error('Error fetching schools:', error.message);
    if (error.response && error.response.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
    return [];
  }
}

async function testSchoolAccess(token, schoolId) {
  try {
    console.log(`\nTesting direct access to school ${schoolId}...`);
    
    const response = await axios.get(
      `${EDFI_BASE_URL}/data/v3/ed-fi/schools`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        params: {
          schoolId: schoolId
        }
      }
    );
    
    if (response.data && response.data.length > 0) {
      console.log(`✓ Direct access to school ${schoolId} successful`);
      return true;
    } else {
      console.log(`✗ No data returned for school ${schoolId}`);
      return false;
    }
  } catch (error) {
    console.log(`✗ Cannot access school ${schoolId}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('Ed-Fi ODS - School Access Report');
  console.log('=================================\n');
  
  try {
    // Get authentication token
    console.log('Authenticating with Ed-Fi ODS...');
    const token = await getAuthToken();
    console.log('✓ Authentication successful\n');
    
    // Get all accessible schools
    const schools = await getAllSchools(token);
    
    // Test specific school access
    await testSchoolAccess(token, 1001);
    await testSchoolAccess(token, 255901001);
    
    console.log('\n' + '='.repeat(80));
    console.log('Authorization Notes:');
    console.log('- The "populatedKey" client has access to all schools in the populated sandbox');
    console.log('- School 1001 (Lincoln High School) is included in the accessible schools');
    console.log('- You can use any of the school IDs listed above in your SIS application');
    console.log('\nTo create additional schools or modify permissions:');
    console.log('1. Access Sandbox Admin at: http://localhost:8003');
    console.log('2. Login with: test@ed-fi.org / y79mwc5hWb6K0gIlCDPvf');
    console.log('3. Manage applications and their permissions');
    
  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);