import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DesignSystemProvider } from './designSystem';
import { ToastProvider } from './components/molecules';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { StudentsList } from './pages/Students/StudentsList';
import { StudentProfile } from './pages/Students/StudentProfile';
import { StudentEdit } from './pages/Students/StudentEdit';
import ApplicationsList from './pages/Admissions/ApplicationsList';
import ApplicationForm from './pages/Admissions/ApplicationForm';
import ApplicationDetails from './pages/Admissions/ApplicationDetails';
import EnrollmentWizard from './pages/Enrollment/EnrollmentWizard';
import { CourseCatalog, MasterSchedule, StudentSchedule, StudentScheduling } from './pages/Scheduling';
import Attendance from './pages/Attendance';
import Gradebook from './pages/Gradebook/Gradebook';
import { Reports } from './pages/Reports';
import { DisciplineManagement, IncidentForm } from './pages/Discipline';
import StaffManagement from './pages/Staff/StaffManagement';
import Settings from './pages/Settings/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DesignSystemProvider>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="students" element={<StudentsList />} />
                  <Route path="students/:id" element={<StudentProfile />} />
                  <Route path="students/:id/edit" element={<StudentEdit />} />
                  <Route path="students/new" element={<StudentEdit />} />
                  <Route path="staff" element={<StaffManagement />} />
                  <Route path="staff/:id" element={<div>Staff Profile - Coming Soon</div>} />
                  <Route path="admissions">
                    <Route index element={<Navigate to="applications" replace />} />
                    <Route path="applications" element={<ApplicationsList />} />
                    <Route path="applications/new" element={<ApplicationForm />} />
                    <Route path="applications/:id" element={<ApplicationDetails />} />
                  </Route>
                  <Route path="enrollment/:studentId" element={<EnrollmentWizard />} />
                  <Route path="courses" element={<CourseCatalog />} />
                  <Route path="scheduling">
                    <Route index element={<Navigate to="master" replace />} />
                    <Route path="master" element={<MasterSchedule />} />
                    <Route path="student" element={<StudentSchedule />} />
                    <Route path="register" element={<StudentScheduling />} />
                  </Route>
                  <Route path="attendance" element={<Attendance />} />
                  <Route path="grades" element={<Gradebook />} />
                  <Route path="discipline">
                    <Route index element={<DisciplineManagement />} />
                    <Route path="new" element={<IncidentForm />} />
                    <Route path=":id" element={<IncidentForm />} />
                    <Route path=":id/edit" element={<IncidentForm />} />
                    <Route path="report" element={<div>Discipline Report - Coming Soon</div>} />
                  </Route>
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="profile" element={<div>Profile - Coming Soon</div>} />
                </Route>
                <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </DesignSystemProvider>
    </QueryClientProvider>
  );
}

export default App
