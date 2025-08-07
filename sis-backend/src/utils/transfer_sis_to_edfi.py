import os
import asyncio
from datetime import datetime
import httpx # Using httpx for async HTTP requests

# Configuration for SIS Backend API
SIS_API_BASE_URL = "http://localhost:5000/api" # SIS backend runs on port 5000 with /api prefix
SIS_ADMIN_EMAIL = "admin@school.edu"
SIS_ADMIN_PASSWORD = "admin123"

import base64 # Added for Base64 encoding
EDFI_API_BASE_URL = "http://localhost:8001/data/v3" # Adjust if your Ed-Fi instance uses a different path
EDFI_API_KEY = "minimal"
EDFI_API_SECRET = "minimalSecret"

SIS_AUTH_TOKEN = None
EDFI_AUTH_TOKEN = None

async def get_sis_access_token():
    global SIS_AUTH_TOKEN
    login_url = f"{SIS_API_BASE_URL}/auth/login"
    headers = {
        "Content-Type": "application/json"
    }
    data = {
        "email": SIS_ADMIN_EMAIL,
        "password": SIS_ADMIN_PASSWORD
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(login_url, headers=headers, json=data)
        response.raise_for_status()
        SIS_AUTH_TOKEN = response.json()["token"]
        print("Obtained SIS API access token.")

async def get_edfi_access_token():
    global EDFI_AUTH_TOKEN
    token_url = "http://localhost:8001/oauth/token" # Adjust if your Ed-Fi instance uses a different path
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "grant_type": "client_credentials",
        "client_id": EDFI_API_KEY,
        "client_secret": EDFI_API_SECRET
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, headers=headers, data=data)
        response.raise_for_status()
        EDFI_AUTH_TOKEN = response.json()["access_token"]
        print("Obtained Ed-Fi API access token.")

async def send_to_edfi(endpoint: str, data: dict):
    url = f"{EDFI_API_BASE_URL}/{endpoint}"
    headers = {
        "Authorization": f"Bearer {EDFI_AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=data)
            response.raise_for_status()
            print(f"Successfully sent data to {endpoint}: {response.status_code}")
            return response.json()
        except httpx.HTTPStatusError as e:
            print(f"Error sending data to {endpoint}: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return None

async def fetch_from_sis(endpoint: str):
    url = f"{SIS_API_BASE_URL}/{endpoint}"
    headers = {
        "Authorization": f"Bearer {SIS_AUTH_TOKEN}"
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.json()

async def transfer_schools():
    print("Transferring Schools...")
    schools = await fetch_from_sis("schools")
    for school in schools:
        edfi_school_payload = {
            "schoolId": school["schoolId"],
            "nameOfInstitution": school["name"],
            "educationOrganizationCategories": [
                {"educationOrganizationCategoryDescriptor": "uri://ed-fi.org/EducationOrganizationCategoryDescriptor#School"}
            ],
            "address": {
                "addressTypeDescriptor": "uri://ed-fi.org/AddressTypeDescriptor#Physical",
                "streetNumberName": school["address"],
                "city": school["city"],
                "stateAbbreviationDescriptor": f"uri://ed-fi.org/StateAbbreviationDescriptor#{school["state"]}",
                "postalCode": school["zipCode"],
                "nameOfCounty": "UNKNOWN" # Placeholder, adjust if you have this data
            },
            "telephone": {
                "telephoneNumber": school["phone"],
                "telephoneNumberTypeDescriptor": "uri://ed-fi.org/TelephoneNumberTypeDescriptor#Main"
            },
            "schoolTypeDescriptor": f"uri://ed-fi.org/SchoolTypeDescriptor#{school["type"]}" # Map SIS type to Ed-Fi descriptor
        }
        await send_to_edfi("schools", edfi_school_payload)
    print("Schools transfer complete.")

async def transfer_students():
    print("Transferring Students...")
    students = await fetch_from_sis("students")
    for student in students:
        edfi_student_payload = {
            "studentUniqueId": student["studentUniqueId"],
            "firstName": student["firstName"],
            "lastSurname": student["lastName"],
            "birthDate": student["birthDate"].split('T')[0], # Format to YYYY-MM-DD
            "sexDescriptor": f"uri://ed-fi.org/SexDescriptor#{student["gender"].upper()}" if student["gender"] else "uri://ed-fi.org/SexDescriptor#UNKNOWN", # Map SIS gender to Ed-Fi descriptor
            "addresses": [
                {
                    "addressTypeDescriptor": "uri://ed-fi.org/AddressTypeDescriptor#Home",
                    "streetNumberName": student["address"],
                    "city": student["city"],
                    "stateAbbreviationDescriptor": f"uri://ed-fi.org/StateAbbreviationDescriptor#{student["state"]}",
                    "postalCode": student["zipCode"],
                    "congressionalDistrict": "UNKNOWN" # Placeholder
                }
            ],
            "electronicMails": [
                {
                    "electronicMailTypeDescriptor": "uri://ed-fi.org/ElectronicMailTypeDescriptor#Work",
                    "electronicMailAddress": student["email"]
                }
            ],
            "telephones": [
                {
                    "telephoneNumberTypeDescriptor": "uri://ed-fi.org/TelephoneNumberTypeDescriptor#Main",
                    "telephoneNumber": student["phone"]
                }
            ],
            "hispanicLatinoEthnicity": False, # Placeholder, adjust if you have this data
            "oldEthnicityDescriptor": "uri://ed-fi.org/OldEthnicityDescriptor#Not Hispanic or Latino", # Placeholder
            "races": [ # Placeholder, adjust if you have this data
                {"raceDescriptor": "uri://ed-fi.org/RaceDescriptor#White"}
            ]
        }
        await send_to_edfi("students", edfi_student_payload)
    print("Students transfer complete.")

async def main():
    await get_sis_access_token()
    await get_edfi_access_token()

    # Transfer Schools first, as Students might depend on them
    await transfer_schools()
    await transfer_students()

    # TODO: Extend this script to transfer other entities:
    # - Staff
    # - Parents and StudentParentAssociations
    # - Courses
    # - Sections (CourseSection)
    # - StudentSectionAssociations (Enrollment)
    # - Attendance
    # - GradingPeriods
    # - DisciplineIncidents and related entities

if __name__ == "__main__":
    asyncio.run(main())