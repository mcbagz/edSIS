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

async function testStudentAssociation() {
  const token = await getAccessToken();
  if (!token) {
    console.error('Failed to authenticate');
    return;
  }
  
  const baseURL = process.env.EDFI_BASE_URL || 'http://localhost:8001';
  
  try {
    // First, get a student
    const studentsResponse = await axios.get(
      `${baseURL}/data/v3/ed-fi/students`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        params: {
          limit: 1
        }
      }
    );
    
    if (studentsResponse.data.length === 0) {
      console.log('No students found in Ed-Fi');
      return;
    }
    
    const student = studentsResponse.data[0];
    console.log(`Testing with student: ${student.studentUniqueId}`);
    
    // Try to create association with Grand Bend High School (255901001)
    const association = {
      studentReference: {
        studentUniqueId: student.studentUniqueId
      },
      schoolReference: {
        schoolId: 255901001
      },
      entryDate: '2024-08-01',
      entryGradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#Ninth Grade'
    };
    
    console.log('\nCreating student-school association:');
    console.log(JSON.stringify(association, null, 2));
    
    const response = await axios.post(
      `${baseURL}/data/v3/ed-fi/studentSchoolAssociations`,
      association,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('\n✅ Successfully created student-school association!');
    console.log('Response:', response.status);
    
  } catch (error) {
    if (error.response) {
      console.error('\n❌ Failed to create association:');
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testStudentAssociation();