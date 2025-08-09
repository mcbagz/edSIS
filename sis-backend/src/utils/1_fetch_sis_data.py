
import os
import asyncio
import json
import httpx

# Configuration for SIS Backend API
SIS_API_BASE_URL = "http://localhost:5000/api"
SIS_ADMIN_EMAIL = "admin@school.edu"
SIS_ADMIN_PASSWORD = "admin123"
SIS_AUTH_TOKEN = None

async def get_sis_access_token():
    global SIS_AUTH_TOKEN
    login_url = f"{SIS_API_BASE_URL}/auth/login"
    headers = {"Content-Type": "application/json"}
    data = {"email": SIS_ADMIN_EMAIL, "password": SIS_ADMIN_PASSWORD}
    async with httpx.AsyncClient() as client:
        response = await client.post(login_url, headers=headers, json=data)
        response.raise_for_status()
        SIS_AUTH_TOKEN = response.json()["token"]
        print("Obtained SIS API access token.")

async def fetch_from_sis(endpoint: str):
    url = f"{SIS_API_BASE_URL}/{endpoint}"
    headers = {"Authorization": f"Bearer {SIS_AUTH_TOKEN}"}
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.json()

async def main():
    await get_sis_access_token()

    print("Fetching schools...")
    schools = await fetch_from_sis("schools")
    with open("data/schools.json", "w") as f:
        json.dump(schools, f, indent=4)
    print(f"Successfully saved {len(schools)} schools to data/schools.json")

    print("Fetching students...")
    students = await fetch_from_sis("students")
    with open("data/students.json", "w") as f:
        json.dump(students, f, indent=4)
    print(f"Successfully saved {len(students)} students to data/students.json")

if __name__ == "__main__":
    asyncio.run(main())
