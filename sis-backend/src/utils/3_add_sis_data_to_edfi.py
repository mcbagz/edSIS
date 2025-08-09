import os
import requests
from dotenv import load_dotenv
import base64
import json

load_dotenv()

def get_edfi_access_token(base_url, client_id, client_secret):
    token_url = f"{base_url}/oauth/token"
    credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()

    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': f'Basic {credentials}'
    }
    payload = {'grant_type': 'client_credentials'}

    try:
        token_response = requests.post(token_url, data=payload, headers=headers, verify=False) # Set verify=True for production
        token_response.raise_for_status()
        return token_response.json().get('access_token')
    except requests.exceptions.RequestException as e:
        print(f'Failed to obtain Ed-Fi access token: {e}')
        if hasattr(e, 'response') and e.response is not None:
            print(f'Response: {e.response.status_code} - {e.response.text}')
        return None

def upload_data_to_edfi(data, endpoint, access_token, base_url):
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    url = f"{base_url}/data/v3/ed-fi/{endpoint}"

    try:
        response = requests.post(url, headers=headers, json=data, verify=False) # Set verify=True for production
        response.raise_for_status()
        print(f'Successfully uploaded data to {endpoint}')
        return True
    except requests.exceptions.RequestException as e:
        print(f'Failed to upload data to {endpoint}: {e}')
        if hasattr(e, 'response') and e.response is not None:
            print(f'Response: {e.response.status_code} - {e.response.text}')
        return False

def sync_sis_data_to_edfi():
    print('Starting SIS data synchronization to Ed-Fi ODS...')

    base_url = os.getenv('EDFI_API_BASE_URL')
    client_id = os.getenv('EDFI_API_CLIENT_ID')
    client_secret = os.getenv('EDFI_API_CLIENT_SECRET')

    if not base_url or not client_id or not client_secret:
        print('Missing required Ed-Fi environment variables.')
        print('Please ensure EDFI_API_BASE_URL, EDFI_API_CLIENT_ID, and EDFI_API_CLIENT_SECRET are set in your .env file.')
        return

    access_token = get_edfi_access_token(base_url, client_id, client_secret)
    if not access_token:
        print('Exiting: Could not obtain Ed-Fi access token.')
        return

    # --- STEP 1: Load SIS Data ---
    sis_data_schools_file = 'C:\Users\mcbag\gauntlet\finalsis\sis-backend\data\schools.json'
    sis_data_students_file = 'C:\Users\mcbag\gauntlet\finalsis\sis-backend\data\students.json'

    schools_data = []
    students_data = {'students': []}

    try:
        with open(sis_data_schools_file, 'r') as f:
            schools_data = json.load(f)
        print(f'Successfully loaded SIS schools data from {sis_data_schools_file}')
    except FileNotFoundError:
        print(f'SIS schools data file not found at {sis_data_schools_file}. Please ensure 1_fetch_sis_data.py has been run.')
        return
    except json.JSONDecodeError:
        print(f'Error decoding JSON from {sis_data_schools_file}. Check file format.')
        return

    try:
        with open(sis_data_students_file, 'r') as f:
            students_data = json.load(f)
        print(f'Successfully loaded SIS students data from {sis_data_students_file}')
    except FileNotFoundError:
        print(f'SIS students data file not found at {sis_data_students_file}. Please ensure 1_fetch_sis_data.py has been run.')
        return
    except json.JSONDecodeError:
        print(f'Error decoding JSON from {sis_data_students_file}. Check file format.')
        return

    # --- STEP 2: Process and Upload Schools ---
    print(f'\nProcessing {len(schools_data)} schools...')
    for sis_school in schools_data:
        edfi_school = {
            "schoolId": sis_school.get('schoolId'),
            "nameOfInstitution": sis_school.get('name'),
            "educationOrganizationCategories": [
                {"educationOrganizationCategoryDescriptor": "uri://ed-fi.org/EducationOrganizationCategoryDescriptor#School"}
            ],
            "gradeLevels": [
                {"gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#Kindergarten"},
                {"gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#First Grade"},
                {"gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#Second Grade"},
                {"gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#Third Grade"},
                {"gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#Fourth Grade"},
                {"gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#Fifth Grade"},
                {"gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#Sixth Grade"},
                {"gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#Seventh Grade"},
                {"gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#Eighth Grade"},
                {"gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#Ninth Grade"},
                {"gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#Tenth Grade"},
                {"gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#Eleventh Grade"},
                {"gradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#Twelfth Grade"}
            ],
            "addresses": [
                {
                    "addressTypeDescriptor": "uri://ed-fi.org/AddressTypeDescriptor#Mailing",
                    "streetNumberName": sis_school.get('address'),
                    "city": sis_school.get('city'),
                    "stateAbbreviationDescriptor": f"uri://ed-fi.org/StateAbbreviationDescriptor#{sis_school.get('state')}",
                    "postalCode": sis_school.get('zipCode')
                }
            ],
            "telephoneNumbers": [
                {
                    "telephoneNumberTypeDescriptor": "uri://ed-fi.org/TelephoneNumberTypeDescriptor#Main",
                    "telephoneNumber": sis_school.get('phone')
                }
            ]
        }
        print(f'Attempting to upload school: {edfi_school.get("nameOfInstitution")}')
        upload_data_to_edfi(edfi_school, 'schools', access_token, base_url)

    # --- STEP 3: Process and Upload Students ---
    students_to_upload = students_data.get('students', [])
    print(f'\nProcessing {len(students_to_upload)} students...')
    for sis_student in students_to_upload:
        sex_map = {'Male': 'Male', 'Female': 'Female'}
        edfi_student = {
            "studentUniqueId": sis_student.get('studentUniqueId'),
            "firstName": sis_student.get('firstName'),
            "lastSurname": sis_student.get('lastSurname'),
            "birthDate": sis_student.get('birthDate')[:10], # Extract YYYY-MM-DD
            "sexDescriptor": f"uri://ed-fi.org/SexDescriptor#{sex_map.get(sis_student.get('birthSex'))}",
            "addresses": [
                {
                    "addressTypeDescriptor": "uri://ed-fi.org/AddressTypeDescriptor#Mailing",
                    "streetNumberName": sis_student.get('address'),
                    "city": sis_student.get('city'),
                    "stateAbbreviationDescriptor": f"uri://ed-fi.org/StateAbbreviationDescriptor#{sis_student.get('state')}",
                    "postalCode": sis_student.get('zipCode')
                }
            ],
            "electronicMails": [
                {
                    "electronicMailTypeDescriptor": "uri://ed-fi.org/ElectronicMailTypeDescriptor#Work",
                    "electronicMailAddress": sis_student.get('email')
                }
            ],
            "telephoneNumbers": [
                {
                    "telephoneNumberTypeDescriptor": "uri://ed-fi.org/TelephoneNumberTypeDescriptor#Main",
                    "telephoneNumber": sis_student.get('phone')
                }
            ]
        }
        print(f'Attempting to upload student: {edfi_student.get("firstName")} {edfi_student.get("lastSurname")}')
        upload_data_to_edfi(edfi_student, 'students', access_token, base_url)

    print('\nSIS data synchronization to Ed-Fi ODS complete.')

if __name__ == '__main__':
    sync_sis_data_to_edfi()