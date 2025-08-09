const axios = require('axios');
require('dotenv').config();

async function getAccessToken() {
  const baseURL = process.env.EDFI_BASE_URL || 'http://localhost:8001';
  const clientId = process.env.EDFI_CLIENT_ID || 'populatedKey';
  const clientSecret = process.env.EDFI_CLIENT_SECRET || 'populatedSecret';
  
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  try {
    const response = await axios.post(
      `${baseURL}/oauth/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Failed to get token:', error.response?.data || error.message);
    return null;
  }
}

async function checkSchools() {
  const token = await getAccessToken();
  if (!token) {
    console.error('Failed to authenticate');
    return;
  }
  
  const baseURL = process.env.EDFI_BASE_URL || 'http://localhost:8001';
  
  try {
    const response = await axios.get(
      `${baseURL}/data/v3/ed-fi/schools`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    
    console.log(`Found ${response.data.length} schools in Ed-Fi:`);
    response.data.forEach(school => {
      console.log(`- SchoolId: ${school.schoolId}, Name: ${school.nameOfInstitution}`);
    });
    
    // Check specifically for school 1001
    const school1001 = response.data.find(s => s.schoolId === 1001);
    if (school1001) {
      console.log('\n✅ School 1001 exists in Ed-Fi!');
    } else {
      console.log('\n❌ School 1001 not found in Ed-Fi');
    }
    
  } catch (error) {
    console.error('Error fetching schools:', error.response?.data || error.message);
  }
}

checkSchools();