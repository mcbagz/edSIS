import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testEdFiConnection() {
  console.log('Testing Ed-Fi Connection...');

  const baseURL = process.env.EDFI_API_BASE_URL;
  const clientId = process.env.EDFI_API_CLIENT_ID;
  const clientSecret = process.env.EDFI_API_CLIENT_SECRET;

  if (!baseURL || !clientId || !clientSecret) {
    console.error('❌ Missing required Ed-Fi environment variables.');
    console.error('Please ensure EDFI_API_BASE_URL, EDFI_API_CLIENT_ID, and EDFI_API_CLIENT_SECRET are set in your .env file.');
    return;
  }

  console.log('API Base URL:', baseURL);
  console.log('API Client ID:', clientId);

  const isHttps = baseURL.startsWith('https');
  const axiosConfig: any = isHttps ? { httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }) } : {};

  try {
    // Test basic API endpoint
    const apiResponse = await axios.get(baseURL, axiosConfig);
    console.log('✅ Ed-Fi API is reachable');
    console.log('Ed-Fi Version:', (apiResponse.data as any).version);
    console.log('Data Models:', (apiResponse.data as any).dataModels);

    // Test OAuth endpoint
    console.log('\nTesting OAuth with provided credentials...');
    const tokenUrl = `${baseURL}/oauth/token`;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
      const tokenResponse = await axios.post(
        tokenUrl,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
          },
          ...axiosConfig
        }
      );
      console.log('✅ OAuth token obtained successfully');
      const accessToken = (tokenResponse.data as any).access_token;
      console.log('Token:', accessToken.substring(0, 20) + '...');

      // Test data endpoint with auth
      console.log('\nTesting data endpoint with authentication...');
      try {
        const dataResponse = await axios.get(
          `${baseURL}/data/v3/ed-fi/schools`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
            ...axiosConfig
          }
        );
        console.log('✅ Data endpoint accessible and returned data.');
        console.log(`Found ${(dataResponse.data as any).length} schools.`);
      } catch (dataError: any) {
        console.log('❌ Data endpoint error:', dataError.response?.data || dataError.message);
      }

    } catch (oauthError: any) {
      console.log('❌ OAuth failed:', oauthError.response?.data || oauthError.message);
      console.log('\nPlease check your EDFI_API_CLIENT_ID and EDFI_API_CLIENT_SECRET values.');
    }

  } catch (error: any) {
    console.error('❌ Failed to connect to Ed-Fi:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\nMake sure Ed-Fi ODS is running and accessible at the configured URL');
    }
    if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
    }
  }
}

testEdFiConnection();