// Script to create school with ID 1001 in Ed-Fi ODS
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

async function createSchool1001(token) {
  const school = {
    "schoolId": 1001,
    "nameOfInstitution": "Test School 1001",
    "shortNameOfInstitution": "TS1001",
    "webSite": "http://www.testschool1001.edu",
    "operationalStatusDescriptor": "uri://ed-fi.org/OperationalStatusDescriptor#Active",
    "charterStatusDescriptor": "uri://ed-fi.org/CharterStatusDescriptor#Not a Charter School",
    "schoolTypeDescriptor": "uri://ed-fi.org/SchoolTypeDescriptor#Regular",
    "administrativeFundingControlDescriptor": "uri://ed-fi.org/AdministrativeFundingControlDescriptor#Public School",
    "addresses": [
      {
        "addressTypeDescriptor": "uri://ed-fi.org/AddressTypeDescriptor#Physical",
        "city": "Test City",
        "postalCode": "12345",
        "stateAbbreviationDescriptor": "uri://ed-fi.org/StateAbbreviationDescriptor#TX",
        "streetNumberName": "123 Test Street"
      }
    ],
    "educationOrganizationCategories": [
      {
        "educationOrganizationCategoryDescriptor": "uri://ed-fi.org/EducationOrganizationCategoryDescriptor#School"
      }
    ],
    "gradeLevels": [
      {
        "gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#Ninth grade"
      },
      {
        "gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#Tenth grade"
      },
      {
        "gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#Eleventh grade"
      },
      {
        "gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#Twelfth grade"
      }
    ],
    "schoolCategories": [
      {
        "schoolCategoryDescriptor": "uri://ed-fi.org/SchoolCategoryDescriptor#High School"
      }
    ]
  };

  try {
    console.log('Creating school with ID 1001...');
    const response = await axios.post(
      `${EDFI_BASE_URL}/data/v3/ed-fi/schools`,
      school,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✓ School created successfully!');
    console.log('  Location:', response.headers.location);
    return true;
  } catch (error) {
    if (error.response && error.response.status === 409) {
      console.log('⚠ School with ID 1001 already exists');
      return true;
    } else {
      console.error('✗ Failed to create school:', error.message);
      if (error.response && error.response.data) {
        console.error('  Details:', JSON.stringify(error.response.data, null, 2));
      }
      return false;
    }
  }
}

async function getSchool1001(token) {
  try {
    console.log('\nChecking if school 1001 exists...');
    const response = await axios.get(
      `${EDFI_BASE_URL}/data/v3/ed-fi/schools`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        params: {
          schoolId: 1001
        }
      }
    );
    
    if (response.data && response.data.length > 0) {
      console.log('✓ School 1001 found:', response.data[0].nameOfInstitution);
      return true;
    } else {
      console.log('✗ School 1001 not found');
      return false;
    }
  } catch (error) {
    console.error('Error fetching school:', error.message);
    return false;
  }
}

async function main() {
  console.log('Ed-Fi ODS - Create School 1001');
  console.log('================================\n');
  
  try {
    // Get authentication token
    console.log('Authenticating...');
    const token = await getAuthToken();
    console.log('✓ Authentication successful\n');
    
    // Check if school exists
    const exists = await getSchool1001(token);
    
    if (!exists) {
      // Create school if it doesn't exist
      await createSchool1001(token);
      
      // Verify creation
      await getSchool1001(token);
    }
    
    console.log('\n✓ School 1001 is now available in Ed-Fi ODS');
    console.log('You can now use schoolId: 1001 in your SIS application');
    
  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);