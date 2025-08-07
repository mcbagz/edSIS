import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import TeacherGradebook from './TeacherGradebook';
import StudentGrades from './StudentGrades';
import ReportCard from './ReportCard';
import api from '../../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`gradebook-tabpanel-${index}`}
      aria-labelledby={`gradebook-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Gradebook: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Teacher state
  const [teacherSections, setTeacherSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  
  // Student state
  const [studentData, setStudentData] = useState<any>(null);
  
  // Grading periods
  const [gradingPeriods, setGradingPeriods] = useState<any[]>([]);

  useEffect(() => {
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load grading periods
      const periodsResponse = await api.get('/grading-periods');
      setGradingPeriods(periodsResponse.data);

      if (user?.role === 'TEACHER') {
        // Load teacher's sections
        const sectionsResponse = await api.get(`/course-sections/teacher/${user.id}`);
        setTeacherSections(sectionsResponse.data);
        if (sectionsResponse.data.length > 0) {
          setSelectedSectionId(sectionsResponse.data[0].id);
        }
      } else if (user?.role === 'STUDENT') {
        // Load student data
        const studentResponse = await api.get(`/students/user/${user.id}`);
        setStudentData(studentResponse.data);
      } else if (user?.role === 'PARENT') {
        // Load parent's children
        // This would need to be implemented based on parent-student relationships
      }

      setError(null);
    } catch (err) {
      setError('Failed to load gradebook data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Render based on user role
  if (user?.role === 'TEACHER') {
    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 3 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>Gradebook</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Gradebook" />
              <Tab label="Assignments" />
              <Tab label="Reports" />
            </Tabs>
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>Course Section</InputLabel>
              <Select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                label="Course Section"
              >
                {teacherSections.map(section => (
                  <MenuItem key={section.id} value={section.id}>
                    {section.course?.name} - Section {section.sectionIdentifier} ({section.period})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {selectedSectionId && <TeacherGradebook courseSectionId={selectedSectionId} />}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Typography>Assignment management coming soon...</Typography>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Typography>Class reports and analytics coming soon...</Typography>
        </TabPanel>
      </Box>
    );
  }

  if (user?.role === 'STUDENT' && studentData) {
    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 3 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>My Grades</Typography>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Current Grades" />
            <Tab label="Report Cards" />
            <Tab label="Transcript" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <StudentGrades studentId={studentData.id} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <ReportCard studentId={studentData.id} gradingPeriods={gradingPeriods} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Typography>Transcript coming soon...</Typography>
        </TabPanel>
      </Box>
    );
  }

  if (user?.role === 'PARENT') {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>Student Grades</Typography>
        <Typography>
          Select a student to view their grades and report cards.
        </Typography>
        {/* Parent view would show their children's grades */}
      </Box>
    );
  }

  if (user?.role === 'ADMIN') {
    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 3 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>Gradebook Administration</Typography>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Overview" />
            <Tab label="Grade Reports" />
            <Tab label="GPA Rankings" />
            <Tab label="Settings" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography>School-wide gradebook overview coming soon...</Typography>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Typography>Generate grade reports for all students...</Typography>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Typography>View GPA rankings and honor roll...</Typography>
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <Typography>Configure grading scales and policies...</Typography>
        </TabPanel>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="info">
        Gradebook access is not available for your user role.
      </Alert>
    </Box>
  );
};

export default Gradebook;