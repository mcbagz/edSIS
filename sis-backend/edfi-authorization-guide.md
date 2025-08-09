# Ed-Fi ODS Authorization Configuration Guide

## Current Status ✅

**School ID 1001 is already accessible!** 

The `populatedKey` client in your Ed-Fi sandbox has access to ALL schools, including:
- School 1001 (Lincoln High School)
- School 255901001 (Grand Bend High School)
- School 255901044 (Grand Bend Middle School)
- School 255901107 (Grand Bend Elementary School)
- And 3 other schools (UT Austin schools)

## Available Schools in Your Ed-Fi Instance

| School ID | Name | Type |
|-----------|------|------|
| 1001 | Lincoln High School | High School |
| 5 | UT Austin College of Education Graduate | Postsecondary |
| 6 | UT Austin College of Education Under Graduate | Postsecondary |
| 7 | UT Austin Extended Campus | Postsecondary |
| 255901001 | Grand Bend High School | High School |
| 255901044 | Grand Bend Middle School | Middle School |
| 255901107 | Grand Bend Elementary School | Elementary School |

## How Ed-Fi Authorization Works

Ed-Fi uses claim-based authorization with different strategies:

### 1. **Sandbox Mode (Current Setup)**
- The `populatedKey` client has unrestricted access to ALL data
- No school-specific restrictions
- Perfect for development and testing
- This is why you can already access school 1001

### 2. **Education Organization Authorization**
When not in sandbox mode, Ed-Fi can restrict access based on:
- Specific school IDs
- Local Education Agency (LEA) associations
- State Education Agency (SEA) associations

### 3. **Claim Sets**
Defines what resources and actions a client can perform:
- Read/Write/Delete permissions
- Resource-level access (Students, Schools, Grades, etc.)

## Managing Authorization

### Option 1: Keep Current Setup (Recommended for Development)
Your current setup already allows access to all schools. No changes needed!

### Option 2: Create Additional API Clients
Access the Sandbox Admin to create new clients with different permissions:

1. Navigate to: http://localhost:8003
2. Login with:
   - Email: `test@ed-fi.org`
   - Password: `y79mwc5hWb6K0gIlCDPvf`
3. Go to "Applications" section
4. Create a new application with custom claim sets

### Option 3: Modify Database Directly (Advanced)
The authorization is stored in the EdFi_Security database. You can modify:
- `dbo.Applications` - Application configurations
- `dbo.ApplicationEducationOrganizations` - School associations
- `dbo.ClaimSets` - Permission sets

## Code Examples

### Check Access to Any School
```javascript
async function checkSchoolAccess(schoolId) {
  const token = await getAuthToken();
  
  const response = await axios.get(
    'http://localhost:8001/data/v3/ed-fi/schools',
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      params: {
        schoolId: schoolId
      }
    }
  );
  
  return response.data.length > 0;
}

// Example usage
const hasAccess = await checkSchoolAccess(1001); // Returns true
```

### Create Data for a Specific School
```javascript
async function createStudentForSchool(schoolId, studentData) {
  const token = await getAuthToken();
  
  // Create student
  const student = {
    studentUniqueId: studentData.id,
    firstName: studentData.firstName,
    lastSurname: studentData.lastName,
    birthDate: studentData.birthDate
  };
  
  await axios.post(
    'http://localhost:8001/data/v3/ed-fi/students',
    student,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  // Enroll student in school
  const enrollment = {
    schoolReference: {
      schoolId: schoolId
    },
    studentReference: {
      studentUniqueId: studentData.id
    },
    entryDate: "2024-08-01",
    entryGradeLevelDescriptor: "uri://ed-fi.org/GradeLevelDescriptor#Ninth grade",
    entryTypeDescriptor: "uri://ed-fi.org/EntryTypeDescriptor#Transfer from a public school in the same local education agency"
  };
  
  await axios.post(
    'http://localhost:8001/data/v3/ed-fi/studentSchoolAssociations',
    enrollment,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
}
```

## Testing Scripts Available

1. **test-edfi-connection.js** - Tests basic connectivity
2. **list-all-schools.js** - Shows all accessible schools
3. **create-school-1001.js** - Creates/verifies school 1001 exists

## Troubleshooting

### If you need to add more schools:
```javascript
// Use the same pattern as create-school-1001.js
const newSchool = {
  schoolId: 2001,  // Your desired ID
  nameOfInstitution: "Your School Name",
  // ... other required fields
};
```

### If you need to check current permissions:
1. Check the Sandbox Admin UI
2. Or query the EdFi_Security database directly
3. Test with actual API calls to verify access

## Summary

✅ **You already have full access to school ID 1001 and all other schools in the sandbox!**

The `populatedKey` client in the sandbox environment has unrestricted access by design, making it perfect for development and testing. You can:
- Read/write data for any school
- Create new schools with any ID
- Manage students, staff, and courses across all schools

No additional configuration is needed for your SIS backup functionality!