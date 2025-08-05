import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  AutoFixHigh as AutoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import { useToast } from '../../components/molecules/Toast';
import { getCourses } from '../../services/courseService';
import { generateSchedule, checkConflicts } from '../../services/schedulingService';

const steps = ['Select Courses', 'Review Conflicts', 'Generate Schedule', 'Confirm Enrollment'];

export const StudentScheduling: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [generatedSchedule, setGeneratedSchedule] = useState<any>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentId] = useState(localStorage.getItem('studentId') || '1');
  const [sessionId] = useState(localStorage.getItem('currentSessionId') || '550e8400-e29b-41d4-a716-446655440001');
  const { showToast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await getCourses();
      setCourses(data);
    } catch (error) {
      showToast('Failed to fetch courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      // Move to review conflicts
      if (selectedCourses.length === 0) {
        showToast('Please select at least one course', 'warning');
        return;
      }
      setActiveStep(1);
    } else if (activeStep === 1) {
      // Generate schedule
      await handleGenerateSchedule();
    } else if (activeStep === 2) {
      // Confirm enrollment
      await handleConfirmEnrollment();
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleGenerateSchedule = async () => {
    try {
      setLoading(true);
      const result = await generateSchedule({
        studentId,
        courseIds: selectedCourses,
        sessionId
      });

      if (result.success) {
        setGeneratedSchedule(result);
        setActiveStep(2);
        showToast('Schedule generated successfully!', 'success');
      } else {
        showToast(result.message || 'Failed to generate schedule', 'error');
        if (result.conflicts) {
          setConflicts(result.conflicts);
        }
      }
    } catch (error) {
      showToast('Error generating schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEnrollment = async () => {
    try {
      setLoading(true);
      // In a real app, this would create enrollment records
      showToast('Enrollment confirmed successfully!', 'success');
      setActiveStep(3);
    } catch (error) {
      showToast('Failed to confirm enrollment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCredits = () => {
    return selectedCourses.reduce((total, courseId) => {
      const course = courses.find(c => c.id === courseId);
      return total + (course?.credits || 0);
    }, 0);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Courses for {sessionId}
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Select the courses you want to enroll in. The auto-scheduler will find the best 
              section combination to avoid conflicts.
            </Alert>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox"></TableCell>
                        <TableCell>Course Code</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Credits</TableCell>
                        <TableCell>Prerequisites</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {courses.map(course => (
                        <TableRow 
                          key={course.id}
                          selected={selectedCourses.includes(course.id)}
                          onClick={() => handleCourseToggle(course.id)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedCourses.includes(course.id)}
                              onChange={() => handleCourseToggle(course.id)}
                            />
                          </TableCell>
                          <TableCell>{course.courseCode}</TableCell>
                          <TableCell>{course.name}</TableCell>
                          <TableCell>{course.department || '-'}</TableCell>
                          <TableCell>{course.credits}</TableCell>
                          <TableCell>
                            {course.prerequisites?.length > 0 
                              ? course.prerequisites.join(', ')
                              : 'None'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Selected Courses
                    </Typography>
                    <List dense>
                      {selectedCourses.map(courseId => {
                        const course = courses.find(c => c.id === courseId);
                        return (
                          <ListItem key={courseId}>
                            <ListItemText
                              primary={course?.courseCode}
                              secondary={`${course?.name} (${course?.credits} credits)`}
                            />
                            <ListItemIcon>
                              <IconButton 
                                size="small"
                                onClick={() => handleCourseToggle(courseId)}
                              >
                                <RemoveIcon />
                              </IconButton>
                            </ListItemIcon>
                          </ListItem>
                        );
                      })}
                    </List>
                    <Typography variant="subtitle1" sx={{ mt: 2 }}>
                      Total Credits: <strong>{calculateTotalCredits()}</strong>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Course Selection
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              The system will automatically check for prerequisites and available sections.
            </Alert>
            
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Courses to Schedule:
                </Typography>
                <List>
                  {selectedCourses.map(courseId => {
                    const course = courses.find(c => c.id === courseId);
                    return (
                      <ListItem key={courseId}>
                        <ListItemIcon>
                          <CheckIcon color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${course?.courseCode} - ${course?.name}`}
                          secondary={`${course?.credits} credits`}
                        />
                      </ListItem>
                    );
                  })}
                </List>
                
                {conflicts.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Potential Issues:
                    </Typography>
                    {conflicts.map((conflict, index) => (
                      <Typography key={index} variant="body2">
                        • {conflict}
                      </Typography>
                    ))}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Generated Schedule
            </Typography>
            {generatedSchedule ? (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Successfully generated a conflict-free schedule!
                </Alert>
                
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Proposed Section Assignments:
                    </Typography>
                    <List>
                      {generatedSchedule.sectionIds?.map((sectionId: string) => (
                        <ListItem key={sectionId}>
                          <ListItemIcon>
                            <CheckIcon color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`Section ${sectionId}`}
                            secondary="Ready for enrollment"
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Box>
            ) : (
              <Alert severity="error">
                Unable to generate schedule. Please go back and adjust your course selection.
              </Alert>
            )}
          </Box>
        );

      case 3:
        return (
          <Box textAlign="center">
            <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Enrollment Confirmed!
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              You have been successfully enrolled in your selected courses.
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 3 }}
              onClick={() => window.location.href = '/scheduling/student'}
            >
              View My Schedule
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoIcon />
          Course Registration & Auto-Scheduler
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {renderStepContent()}
          
          {activeStep < 3 && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
                startIcon={activeStep === 1 ? <AutoIcon /> : null}
              >
                {activeStep === 0 ? 'Next' : 
                 activeStep === 1 ? 'Generate Schedule' : 
                 'Confirm Enrollment'}
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

function IconButton(props: { size: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: props.size === 'small' ? '4px' : '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}