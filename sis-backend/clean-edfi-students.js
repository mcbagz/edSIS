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

async function cleanStudents() {
  const token = await getAccessToken();
  if (!token) {
    console.error('Failed to authenticate');
    return;
  }
  
  const baseURL = process.env.EDFI_BASE_URL || 'http://localhost:8001';
  
  try {
    // Get all students that start with 'S' (our SIS students)
    const response = await axios.get(
      `${baseURL}/data/v3/ed-fi/students`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    
    const sisStudents = response.data.filter(s => s.studentUniqueId && s.studentUniqueId.startsWith('S'));
    console.log(`Found ${sisStudents.length} SIS students to clean up`);
    
    for (const student of sisStudents) {
      try {
        // First, try to delete any student-school associations
        const assocResponse = await axios.get(
          `${baseURL}/data/v3/ed-fi/studentSchoolAssociations`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            },
            params: {
              studentUniqueId: student.studentUniqueId
            }
          }
        );
        
        for (const assoc of assocResponse.data) {
          try {
            await axios.delete(
              `${baseURL}${assoc.link.href}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );
            console.log(`Deleted association for student ${student.studentUniqueId}`);
          } catch (e) {
            // Ignore association deletion errors
          }
        }
      } catch (e) {
        // No associations found
      }
      
      // Now delete the student
      try {
        await axios.delete(
          `${baseURL}${student.link.href}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        console.log(`Deleted student ${student.studentUniqueId}`);
      } catch (error) {
        console.error(`Failed to delete student ${student.studentUniqueId}:`, error.response?.data?.detail || error.message);
      }
    }
    
    console.log('\n✅ Cleanup complete');
    
  } catch (error) {
    console.error('Error during cleanup:', error.response?.data || error.message);
  }
}

cleanStudents();