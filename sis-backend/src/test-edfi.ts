import axios from 'axios';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

// Configure axios to accept self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function testEdFiConnection() {
  console.log('Testing Ed-Fi Connection...');
  console.log('API Base URL:', process.env.EDFI_API_BASE_URL);
  
  try {
    // Test basic API endpoint
    const apiResponse = await axios.get(
      (process.env.EDFI_API_BASE_URL || 'https://localhost/api'),
      { httpsAgent } as any
    );
    console.log('✅ Ed-Fi API is reachable');
    console.log('Ed-Fi Version:', (apiResponse.data as any).version);
    console.log('Data Models:', (apiResponse.data as any).dataModels);
    
    // Test OAuth endpoint with minimal credentials
    console.log('\nTesting OAuth with minimal credentials...');
    const tokenUrl = (process.env.EDFI_API_BASE_URL || 'https://localhost/api') + '/oauth/token';
    
    try {
      const tokenResponse = await axios.post(
        tokenUrl,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from('minimal:minimalSecret').toString('base64')
          },
          httpsAgent
        } as any
      );
      console.log('✅ OAuth token obtained successfully');
      console.log('Token:', (tokenResponse.data as any).access_token?.substring(0, 20) + '...');
    } catch (oauthError: any) {
      console.log('❌ OAuth failed:', oauthError.response?.data || oauthError.message);
      console.log('\nThe "minimal" credentials may not be configured in Ed-Fi.');
      console.log('You need to:');
      console.log('1. Access Ed-Fi Admin App or Admin API');
      console.log('2. Create an API client/application');
      console.log('3. Update the .env file with the correct credentials');
    }
    
    // Test data endpoint (will fail without auth but shows connectivity)
    console.log('\nTesting data endpoint...');
    try {
      const dataResponse = await axios.get(
        (process.env.ED_FI_API_BASE || 'https://localhost/api/data/v3') + '/ed-fi/schools',
        { httpsAgent } as any
      );
      console.log('✅ Data endpoint accessible');
    } catch (dataError: any) {
      if (dataError.response?.status === 401) {
        console.log('✅ Data endpoint reachable (401 Unauthorized expected without token)');
      } else {
        console.log('❌ Data endpoint error:', dataError.message);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Failed to connect to Ed-Fi:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\nMake sure Ed-Fi ODS is running and accessible at the configured URL');
    }
  }
}

testEdFiConnection();