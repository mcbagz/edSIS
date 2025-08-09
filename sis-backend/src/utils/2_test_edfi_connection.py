import os
import requests
from dotenv import load_dotenv
import base64

load_dotenv()

def test_edfi_connection():
    print('Testing Ed-Fi Connection...')

    base_url = os.getenv('EDFI_API_BASE_URL')
    client_id = os.getenv('EDFI_API_CLIENT_ID')
    client_secret = os.getenv('EDFI_API_CLIENT_SECRET')

    if not base_url or not client_id or not client_secret:
        print('Missing required Ed-Fi environment variables.')
        print('Please ensure EDFI_API_BASE_URL, EDFI_API_CLIENT_ID, and EDFI_API_CLIENT_SECRET are set in your .env file.')
        return

    print('API Base URL:', base_url)
    print('API Client ID:', client_id)

    # Handle SSL verification for HTTPS connections
    verify_ssl = not base_url.startswith('https://localhost') # Assuming localhost https might use self-signed certs

    try:
        # Test basic API endpoint
        api_response = requests.get(base_url, verify=verify_ssl)
        api_response.raise_for_status() # Raise an exception for HTTP errors
        print('Ed-Fi API is reachable')
        data = api_response.json()
        print('Ed-Fi Version:', data.get('version'))
        print('Data Models:', data.get('dataModels'))

        # Test OAuth endpoint
        print('\nTesting OAuth with provided credentials...')
        token_url = f"{base_url}/oauth/token"
        credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()

        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': f'Basic {credentials}'
        }
        payload = {'grant_type': 'client_credentials'}

        token_response = requests.post(token_url, data=payload, headers=headers, verify=verify_ssl)
        token_response.raise_for_status()
        print('OAuth token obtained successfully')
        access_token = token_response.json().get('access_token')
        print('Token:', access_token[:20] + '...')

        # Test data endpoint with auth
        print('\nTesting data endpoint with authentication...')
        data_headers = {
            'Authorization': f'Bearer {access_token}'
        }
        data_endpoint_url = f"{base_url}/data/v3/ed-fi/schools"
        data_response = requests.get(data_endpoint_url, headers=data_headers, verify=verify_ssl)
        data_response.raise_for_status()
        print(f'Data endpoint accessible and returned data.')
        print(f"Found {len(data_response.json())} schools.")

    except requests.exceptions.ConnectionError as e:
        print(f'Failed to connect to Ed-Fi: {e}')
        print('\nMake sure Ed-Fi ODS is running and accessible at the configured URL')
    except requests.exceptions.HTTPError as e:
        print(f'HTTP Error: {e.response.status_code} - {e.response.text}')
        if e.response.status_code == 401:
            print('\nPlease check your EDFI_API_CLIENT_ID and EDFI_API_CLIENT_SECRET values.')
    except Exception as e:
        print(f'An unexpected error occurred: {e}')

if __name__ == '__main__':
    test_edfi_connection()