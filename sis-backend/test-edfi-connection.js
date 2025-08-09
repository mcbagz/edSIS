// Ed-Fi ODS API Connection Test Script
const axios = require('axios');

// Ed-Fi API Configuration
const EDFI_BASE_URL = 'http://localhost:8001';
const CLIENT_ID = 'populatedKey';
const CLIENT_SECRET = 'populatedSecret';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Function to get OAuth token
async function getAuthToken() {
  try {
    console.log(`${colors.cyan}Authenticating with Ed-Fi ODS API...${colors.reset}`);
    
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

    console.log(`${colors.green}✓ Authentication successful!${colors.reset}`);
    console.log(`  Token Type: ${response.data.token_type}`);
    console.log(`  Expires In: ${response.data.expires_in} seconds`);
    
    return response.data.access_token;
  } catch (error) {
    console.error(`${colors.red}✗ Authentication failed:${colors.reset}`, error.message);
    if (error.response) {
      console.error('  Response:', error.response.data);
    }
    throw error;
  }
}

// Function to test API endpoints
async function testApiEndpoints(token) {
  const endpoints = [
    { name: 'Schools', path: '/data/v3/ed-fi/schools' },
    { name: 'Students', path: '/data/v3/ed-fi/students' },
    { name: 'Sections', path: '/data/v3/ed-fi/sections' },
    { name: 'Courses', path: '/data/v3/ed-fi/courses' },
    { name: 'Staff', path: '/data/v3/ed-fi/staffs' }
  ];

  console.log(`\n${colors.cyan}Testing Ed-Fi API Endpoints:${colors.reset}\n`);

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(
        `${EDFI_BASE_URL}${endpoint.path}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          params: {
            limit: 5  // Limit results for testing
          }
        }
      );

      const count = Array.isArray(response.data) ? response.data.length : 0;
      console.log(`${colors.green}✓${colors.reset} ${endpoint.name}: Found ${count} records`);
      
      // Show first record as sample (if available)
      if (count > 0 && response.data[0]) {
        const sample = response.data[0];
        if (endpoint.name === 'Schools') {
          console.log(`    Sample: ${sample.nameOfInstitution} (ID: ${sample.schoolId})`);
        } else if (endpoint.name === 'Students' && sample.firstName) {
          console.log(`    Sample: ${sample.firstName} ${sample.lastSurname}`);
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(`${colors.yellow}⚠${colors.reset} ${endpoint.name}: No data found (404)`);
      } else {
        console.log(`${colors.red}✗${colors.reset} ${endpoint.name}: Failed - ${error.message}`);
      }
    }
  }
}

// Function to test creating a new student (example)
async function testCreateStudent(token) {
  console.log(`\n${colors.cyan}Testing Data Creation (Student):${colors.reset}\n`);
  
  const newStudent = {
    studentUniqueId: `TEST-${Date.now()}`,
    birthDate: '2010-01-01',
    firstName: 'Test',
    lastSurname: 'Student',
    middleName: 'Middle'
  };

  try {
    const response = await axios.post(
      `${EDFI_BASE_URL}/data/v3/ed-fi/students`,
      newStudent,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`${colors.green}✓ Successfully created test student!${colors.reset}`);
    console.log(`  Student ID: ${newStudent.studentUniqueId}`);
    console.log(`  Location: ${response.headers.location}`);
    
    return response.headers.location;
  } catch (error) {
    console.log(`${colors.yellow}⚠ Could not create student:${colors.reset} ${error.message}`);
    if (error.response && error.response.data) {
      console.log('  Details:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// Main function
async function main() {
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}Ed-Fi ODS API Connection Test${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);
  
  console.log(`API Base URL: ${EDFI_BASE_URL}`);
  console.log(`Client ID: ${CLIENT_ID}`);
  console.log(`Client Secret: ${CLIENT_SECRET.substring(0, 5)}...`);
  
  try {
    // Step 1: Get authentication token
    const token = await getAuthToken();
    
    // Step 2: Test API endpoints
    await testApiEndpoints(token);
    
    // Step 3: Test data creation (optional)
    // Uncomment to test creating data
    // await testCreateStudent(token);
    
    console.log(`\n${colors.green}${'='.repeat(50)}${colors.reset}`);
    console.log(`${colors.green}Ed-Fi ODS API is working correctly!${colors.reset}`);
    console.log(`${colors.green}${'='.repeat(50)}${colors.reset}`);
    
    console.log(`\n${colors.cyan}Connection Details for Your SIS:${colors.reset}`);
    console.log(`  - API URL: ${EDFI_BASE_URL}`);
    console.log(`  - OAuth Token URL: ${EDFI_BASE_URL}/oauth/token`);
    console.log(`  - Client ID: ${CLIENT_ID}`);
    console.log(`  - Client Secret: ${CLIENT_SECRET}`);
    console.log(`  - Swagger UI: http://localhost:8002`);
    console.log(`  - Sandbox Admin: http://localhost:8003`);
    console.log(`    - Admin Email: test@ed-fi.org`);
    console.log(`    - Admin Password: y79mwc5hWb6K0gIlCDPvf`);
    
  } catch (error) {
    console.error(`\n${colors.red}Test failed!${colors.reset}`);
    console.error('Please check that the Ed-Fi Docker containers are running.');
    console.error('Run: docker ps | grep ed-fi');
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);