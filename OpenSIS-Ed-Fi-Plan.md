### **Project: "OpenSIS-Ed-Fi" - A Feature-Driven Development Plan (Revised)**

#### **1. Guiding Philosophy & Core Architectural Decision**

The fundamental principle is to **directly consume the existing Ed-Fi ODS API** from the frontend application. The new application will act as a client to the Ed-Fi ODS API, translating OpenSIS's user interface and business logic into appropriate API calls.

**Proposed Architecture:**

1.  **Frontend (The SIS Application):** A modern, single-page web application (SPA) built with **React**. This application will replicate the modules, workflows, and visual design as detailed in the `SIS-Detailed-Specification.md` file. It will contain a client-side data layer responsible for interacting with the Ed-Fi ODS API.
2.  **Backend (Existing):** Your Dockerized Ed-Fi ODS, which includes the **Ed-Fi ODS API** and **Ed-Fi ODS Admin API**. These APIs will serve as the primary data source and manipulation layer for the frontend.
3.  **Database (Existing):** Your Dockerized Ed-Fi ODS (**PostgreSQL**).

---

### **2. Research & Feature Analysis**

Before writing any code, the team must thoroughly understand both OpenSIS and the Ed-Fi data model and its API.

*   **Deep Dive into OpenSIS:**
    *   **User Interface (UI) & User Experience (UX) Analysis:** The team needs to gain access to an OpenSIS instance (demo, community edition, or screenshots/videos) to meticulously document every screen, workflow, button, and data entry field.
    *   **Feature Mapping:** For each OpenSIS feature (e.g., "Add New Student," "Record Attendance," "Generate Report Card"), identify:
        *   The specific user interactions involved.
        *   The data points collected/displayed.
        *   The expected outcomes.
    *   **Module Breakdown:** Categorize features into logical modules (e.g., Student Demographics, Enrollment, Scheduling, Grading, Attendance, Discipline, Parent/Student Portals, Reporting).

*   **Ed-Fi ODS Data Model & API Understanding:**
    *   **Schema Review:** Developers must become familiar with the Ed-Fi Data Standard (v3.2, based on your context) documentation, focusing on the core entities and their relationships (e.g., `Student`, `School`, `Section`, `Staff`, `Course`, `AttendanceEvent`, `Grade`).
    *   **API Documentation Exploration:** Crucially, the team must explore the **Swagger UI** provided by your Ed-Fi ODS instance (typically at `https://localhost/api` or `https://localhost/docs` as per your `GETTING_STARTED.md`). This will provide the exact endpoints, request/response schemas, and authentication methods.
    *   **Data Mapping Strategy:** For each OpenSIS data point and workflow identified, determine the corresponding Ed-Fi API endpoint(s), required request parameters, and how to parse the response. This will be the most critical part of the design.
        *   *Example: OpenSIS "Add New Student" form fields -> Ed-Fi ODS API `POST /students` endpoint with `Student` resource payload.*
        *   *Example: OpenSIS "Student Name" display -> Ed-Fi ODS API `GET /students/{id}` endpoint, then extract `firstName` and `lastSurname` from the `Student` resource.*
    *   **Authentication Flow:** Understand how to authenticate with the Ed-Fi ODS API (e.g., OAuth 2.0 client credentials flow, API key/secret). This will dictate the frontend's authentication implementation.

---

### **3. Technical Design & Planning**

This phase translates the research into concrete technical specifications for the frontend application.

*   **Frontend Data Layer Design:**
    *   **API Client:** Implement a client-side module (e.g., using `fetch` or `axios` in JavaScript) to interact with the Ed-Fi ODS API. This client will handle:
        *   Constructing API requests (URLs, headers, body).
        *   Handling authentication (e.g., obtaining and refreshing access tokens).
        *   Parsing API responses.
        *   Handling API errors.
    *   **Data Transformation:** Create functions or classes to transform data between the OpenSIS-like UI format and the Ed-Fi API's data structures. This is where the "translation" logic resides.
        *   *Example: A function `mapOpenSISStudentToEdFiStudent(openSISData)` that takes data from an OpenSIS-style form and converts it into the JSON structure expected by the Ed-Fi `POST /students` endpoint.*
        *   *Example: A function `mapEdFiStudentToOpenSISStudent(edFiData)` that takes an Ed-Fi `Student` resource and formats it for display in the OpenSIS-style UI.*
    *   **Error Handling:** Implement consistent error handling and user feedback mechanisms for API failures.

*   **Frontend UI/UX Design (OpenSIS Clone):**
    *   **Component Breakdown:** Identify reusable UI components (e.g., student search bar, grade entry form, calendar view).
    *   **State Management:** Choose a state management library (e.g., Redux, Zustand, React Context API) to manage application data, including data fetched from the Ed-Fi API.
    *   **Routing:** Define the application's navigation structure, mirroring OpenSIS's modules.
    *   **Styling:** Determine the CSS framework or approach to replicate the visual style described in `SIS-Detailed-Specification.md`.

---

### **4. Incremental Development & Iteration**

Adopt an agile approach, building out modules incrementally, with each module directly consuming the Ed-Fi ODS API.

*   **Phase 1: Core Student Information & Authentication**
    *   **Frontend:**
        *   Develop login/authentication screens that interact with the Ed-Fi ODS API's authentication endpoints.
        *   Create a "Student Search" and "Student Profile View" module, replicating OpenSIS's layout and data display by fetching data from Ed-Fi ODS API `GET /students` and `GET /students/{id}`.
        *   Implement "Add New Student" and "Edit Student" forms that use Ed-Fi ODS API `POST /students` and `PUT /students/{id}`.
    *   **Verification:** Ensure data entered through the new UI correctly appears in the Ed-Fi ODS via API calls, and vice-versa.

*   **Phase 2: Attendance & Scheduling**
    *   **Frontend:**
        *   Attendance entry screen (daily, by class) using Ed-Fi ODS API endpoints for `StudentSectionAttendanceEvent` or similar.
        *   Student schedule view by fetching data from Ed-Fi ODS API `GET /sections`, `GET /courses`, and `GET /studentSectionAssociations`.
        *   Course catalog and section management using relevant Ed-Fi ODS API endpoints.

*   **Phase 3: Grading & Gradebook**
    *   **Frontend:**
        *   Teacher gradebook interface using Ed-Fi ODS API endpoints for `Grade`, `LearningObjective`, `StudentAcademicRecord`, etc.
        *   Student grade view.
        *   Report card generation (initial version) by aggregating data from various Ed-Fi ODS API endpoints.

*   **Phase 4: Portals & Reporting**
    *   **Frontend:**
        *   Develop simplified Parent and Student Portal interfaces, fetching data relevant to the logged-in user from the Ed-Fi ODS API.
        *   Implement basic reporting dashboards by making appropriate Ed-Fi ODS API calls and aggregating data.

*   **Subsequent Phases:** Discipline, Billing, Lesson Planning, Admissions, etc., following the same iterative process.

---

### **5. Quality Assurance & Deployment**

*   **Unit & Integration Testing:**
    *   **Frontend:** Thoroughly test the API client and data transformation logic to ensure correct interaction with the Ed-Fi ODS API. Test UI components and workflows.
*   **End-to-End Testing:** Simulate real user scenarios to ensure the entire system functions as expected, from UI interaction to Ed-Fi API calls and data persistence.
*   **Performance Testing:** Monitor frontend rendering performance and API response times, especially with large datasets.
*   **Security Audits:** Regularly review the frontend application for vulnerabilities, especially regarding API key management and secure communication.
*   **Deployment Strategy:** Define how the Frontend application will be deployed (e.g., static web hosting, Docker container alongside the Ed-Fi ODS Docker setup).

---

### **6. Documentation & Maintenance**

*   **Frontend Code Documentation:** Maintain clear, concise comments and READMEs for the frontend codebase, especially for the API client and data transformation layers.
*   **Deployment Guides:** Provide clear instructions for setting up and deploying the frontend application.
*   **Maintenance Plan:** Establish a plan for ongoing updates, bug fixes, and feature enhancements, considering potential updates to the Ed-Fi ODS API.