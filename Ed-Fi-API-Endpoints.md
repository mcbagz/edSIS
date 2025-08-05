### **Ed-Fi ODS API Endpoints Overview**

This document provides a high-level overview of the types of API endpoints available in the Ed-Fi ODS (Operational Data Store). Your development team should refer to the **Swagger UI** of your running Ed-Fi ODS instance (typically at `https://localhost/api` or `https://localhost/docs`) for the most accurate and up-to-date list of available endpoints, their exact paths, request/response schemas, and authentication requirements.

#### **1. Core Data Domains (Resources)**

The Ed-Fi ODS API exposes various data domains as RESTful resources. Each resource typically supports standard CRUD (Create, Read, Update, Delete) operations.

*   **Student Information:**
    *   `/students`: Manage student demographic information.
    *   `/studentSchoolAssociations`: Link students to schools.
    *   `/studentParentAssociations`: Link students to parents/guardians.
    *   `/studentEducationOrganizationAssociations`: General student-education organization relationships.
    *   `/studentDisciplineIncidents`: Record student disciplinary incidents.
    *   `/studentAssessments`: Manage student assessment results.

*   **Staff Information:**
    *   `/staffs`: Manage staff demographic information.
    *   `/staffSchoolAssociations`: Link staff to schools.
    *   `/staffEducationOrganizationAssignmentAssociations`: Assign staff to education organizations and roles.

*   **School & Education Organization Information:**
    *   `/schools`: Manage school details.
    *   `/educationOrganizations`: General education organization details.
    *   `/courses`: Define courses offered.
    *   `/sections`: Define specific sections of courses.
    *   `/sessions`: Define academic sessions.
    *   `/gradingPeriods`: Define grading periods.
    *   `/academicYears`: Define academic years.

*   **Enrollment & Scheduling:**
    *   `/studentSectionAssociations`: Enroll students in specific sections.
    *   `/staffSectionAssociations`: Assign staff to specific sections.

*   **Attendance:**
    *   `/attendanceEvents`: Record general attendance events.
    *   `/studentSectionAttendanceEvents`: Record student attendance for specific sections.
    *   `/attendanceRegistrations`: Register student attendance.

*   **Grading & Academic Records:**
    *   `/grades`: Record grades for students in sections.
    *   `/gradebookEntries`: Manage gradebook entries (assignments).
    *   `/studentAcademicRecords`: Maintain student academic records.
    *   `/reportCards`: Manage student report cards.

*   **Discipline:**
    *   `/disciplineIncidents`: Record details of disciplinary incidents.
    *   `/disciplineActions`: Record actions taken for disciplinary incidents.

#### **2. Authentication Endpoints**

The Ed-Fi ODS API uses OAuth 2.0 for authentication. Key endpoints include:

*   `/oauth/token`: Used to obtain an access token by providing client ID and client secret.

#### **3. Metadata and Discovery Endpoints**

*   `/metadata`: Provides a comprehensive list of all available API resources and their schemas (often the basis for the Swagger UI).
*   `/health`: Health check endpoint to verify API status.

#### **4. API Versioning**

Ed-Fi APIs are versioned. You will typically see the version in the URL path, e.g., `/v3.2/students`. Ensure your frontend client targets the correct API version.

#### **5. Common API Operations (Examples)**

For most resources, the following HTTP methods are supported:

*   `GET /<resource>`: Retrieve a list of resources (with optional filtering, pagination, and sorting parameters).
*   `GET /<resource>/{id}`: Retrieve a single resource by its unique identifier.
*   `POST /<resource>`: Create a new resource.
*   `PUT /<resource>/{id}`: Update an existing resource.
*   `DELETE /<resource>/{id}`: Delete a resource.

#### **Important Considerations for Your Team:**

*   **Data Relationships:** Ed-Fi data is highly relational. Creating or updating a resource often requires referencing existing related resources (e.g., creating a `studentSectionAssociation` requires valid `studentReference` and `sectionReference` objects).
*   **Required Fields:** Pay close attention to required fields in the API schemas. Missing required data will result in API errors.
*   **Error Handling:** Implement robust error handling for API responses, including status codes (e.g., 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error).
*   **Pagination:** For `GET` requests that return lists of resources, implement pagination to handle large datasets efficiently.
*   **Security:** Ensure API keys and secrets are handled securely and never exposed in the client-side code.

Refer to the Ed-Fi Alliance documentation and the Swagger UI of your specific Ed-Fi ODS instance for the definitive and most detailed API specifications.