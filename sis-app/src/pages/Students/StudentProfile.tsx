import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Grid,
  Card,
  CardContent,
  Skeleton,
  Alert,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Person,
  School,
  ContactPhone,
  LocalHospital,
  History,
  Badge,
  CalendarToday,
  LocationOn,
  Phone,
  Email,
  Warning,
  MedicalServices,
  Medication,
  Save,
  Cancel,
  Home,
  Class,
  Assessment,
  EventAvailable,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Breadcrumbs, useToast } from '../../components';
import { PermissionGuard } from '../../components/PermissionGuard';
import { hasPermission } from '../../utils/permissions';

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
      id={`student-tabpanel-${index}`}
      aria-labelledby={`student-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `student-tab-${index}`,
    'aria-controls': `student-tabpanel-${index}`,
  };
}

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [editMedicalDialog, setEditMedicalDialog] = useState(false);
  const [editEmergencyDialog, setEditEmergencyDialog] = useState(false);
  const [medicalForm, setMedicalForm] = useState({
    conditions: '',
    medications: '',
    allergies: '',
    instructions: '',
  });
  const [emergencyForm, setEmergencyForm] = useState({
    name: '',
    phone: '',
    relationship: '',
  });

  const { data: student, isLoading, error } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentService.getStudentById(id!),
    enabled: !!id,
  });

  const { data: enrollmentHistory } = useQuery({
    queryKey: ['studentEnrollmentHistory', id],
    queryFn: () => studentService.getStudentEnrollmentHistory(id!),
    enabled: !!id,
  });

  const { data: customFields } = useQuery({
    queryKey: ['studentCustomFields', id],
    queryFn: () => studentService.getStudentCustomFields(id!),
    enabled: !!id,
  });

  const updateMedicalMutation = useMutation({
    mutationFn: (data: typeof medicalForm) => 
      studentService.updateStudentMedicalInfo(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      toast.showToast('Medical information updated successfully', 'success');
      setEditMedicalDialog(false);
    },
    onError: () => {
      toast.showToast('Failed to update medical information', 'error');
    },
  });

  const updateEmergencyMutation = useMutation({
    mutationFn: (data: typeof emergencyForm) => 
      studentService.updateStudentEmergencyContact(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      toast.showToast('Emergency contact updated successfully', 'success');
      setEditEmergencyDialog(false);
    },
    onError: () => {
      toast.showToast('Failed to update emergency contact', 'error');
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditMedical = () => {
    if (student) {
      setMedicalForm({
        conditions: student.medical?.conditions || '',
        medications: student.medical?.medications || '',
        allergies: student.medical?.allergies || '',
        instructions: student.medical?.instructions || '',
      });
      setEditMedicalDialog(true);
    }
  };

  const handleEditEmergency = () => {
    if (student) {
      setEmergencyForm({
        name: student.emergencyContact?.name || '',
        phone: student.emergencyContact?.phone || '',
        relationship: student.emergencyContact?.relationship || '',
      });
      setEditEmergencyDialog(true);
    }
  };

  const canEditStudent = hasPermission(user?.role, 'students.edit');

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Students', path: '/students' },
    { label: student ? `${student.firstName} ${student.lastSurname}` : 'Student Profile' },
  ];

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading student information. Please try again later.
        </Alert>
        <Button
          icon={<ArrowBack />}
          iconPosition="start"
          onClick={() => navigate('/students')}
        >
          Back to Students
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs items={breadcrumbItems} sx={{ mb: 2 }} />
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="text"
            icon={<ArrowBack />}
            iconPosition="start"
            onClick={() => navigate('/students')}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            Student Profile
          </Typography>
        </Box>
        <PermissionGuard permission="students.edit">
          {student && (
            <Button
              variant="contained"
              icon={<Edit />}
              iconPosition="start"
              onClick={() => navigate(`/students/${id}/edit`)}
            >
              Edit Student
            </Button>
          )}
        </PermissionGuard>
      </Box>

      {isLoading ? (
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
            <Grid item xs={12}>
              <Skeleton variant="rectangular" height={48} />
            </Grid>
            <Grid item xs={12}>
              <Skeleton variant="rectangular" height={300} />
            </Grid>
          </Grid>
        </Paper>
      ) : student ? (
        <>
          {/* Student Header Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item>
                  <Avatar
                    sx={{ 
                      width: 100, 
                      height: 100, 
                      bgcolor: 'primary.main',
                      fontSize: '2rem',
                      fontWeight: 600,
                    }}
                  >
                    {student.firstName[0]}{student.lastSurname[0]}
                  </Avatar>
                </Grid>
                <Grid item xs>
                  <Typography variant="h5" gutterBottom>
                    {student.firstName} {student.middleName || ''} {student.lastSurname}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Badge fontSize="small" color="action" />
                    <Typography variant="body1" color="text.secondary">
                      Student ID: {student.studentUniqueId}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<CalendarToday sx={{ fontSize: '0.875rem' }} />}
                      label={`Born: ${new Date(student.birthDate).toLocaleDateString()}`}
                      size="small"
                      variant="outlined"
                    />
                    {student.birthSex && (
                      <Chip
                        label={student.birthSex}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {student.gradeLevel && (
                      <Chip
                        icon={<School sx={{ fontSize: '0.875rem' }} />}
                        label={`Grade ${student.gradeLevel}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    <Chip
                      label={student.enrollmentStatus || 'Active'}
                      size="small"
                      color={student.enrollmentStatus === 'Active' ? 'success' : 'default'}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Paper sx={{ mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab icon={<Person />} label="Demographics" {...a11yProps(0)} />
              <Tab icon={<School />} label="Enrollment" {...a11yProps(1)} />
              <Tab icon={<ContactPhone />} label="Contacts" {...a11yProps(2)} />
              <Tab icon={<LocalHospital />} label="Medical" {...a11yProps(3)} />
              <Tab icon={<History />} label="History" {...a11yProps(4)} />
            </Tabs>
          </Paper>

          {/* Tab Panels */}
          <Paper sx={{ p: 3 }}>
            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Full Name
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {student.firstName} {student.middleName || ''} {student.lastSurname}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Student ID
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {student.studentUniqueId}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Birth Date
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {new Date(student.birthDate).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Gender
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {student.birthSex || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Grade Level
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {student.gradeLevel || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Enrollment Status
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {student.enrollmentStatus || 'Active'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {student.email || 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Phone
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {student.phone || 'Not provided'}
                  </Typography>
                </Grid>
                {student.address && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Address
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {student.address}
                      {student.city && `, ${student.city}`}
                      {student.state && `, ${student.state}`}
                      {student.zipCode && ` ${student.zipCode}`}
                    </Typography>
                  </Grid>
                )}
                {customFields && customFields.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Additional Information
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {customFields.map((field: any) => (
                        <Chip
                          key={field.id}
                          label={`${field.field.name}: ${field.value}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Enrollment Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {/* Current Enrollment */}
              {student.enrollments && student.enrollments.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                    Current Courses
                  </Typography>
                  <Grid container spacing={2}>
                    {student.enrollments.map((enrollment: any) => (
                      <Grid item xs={12} md={6} key={enrollment.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                                  {enrollment.courseSection?.course?.courseName || 'Course'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {enrollment.courseSection?.sectionIdentifier || ''}
                                </Typography>
                                {enrollment.courseSection?.teacher && (
                                  <Typography variant="body2" color="text.secondary">
                                    Teacher: {enrollment.courseSection.teacher.firstName} {enrollment.courseSection.teacher.lastName}
                                  </Typography>
                                )}
                              </Box>
                              <Chip
                                label={enrollment.status}
                                size="small"
                                color={enrollment.status === 'Active' ? 'success' : 'default'}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Enrollment History */}
              {enrollmentHistory && enrollmentHistory.length > 0 ? (
                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                    Enrollment History
                  </Typography>
                  {enrollmentHistory.map((session: any, index: number) => (
                    <Box key={index} sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        {session.sessionName}
                      </Typography>
                      <Grid container spacing={2}>
                        {session.enrollments.map((enrollment: any) => (
                          <Grid item xs={12} key={enrollment.id}>
                            <Card variant="outlined">
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                  <Box>
                                    {enrollment.courseSection ? (
                                      <>
                                        <Typography variant="subtitle2">
                                          {enrollment.courseSection.course.courseName}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          Section: {enrollment.courseSection.sectionIdentifier}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          Teacher: {enrollment.courseSection.teacher.firstName} {enrollment.courseSection.teacher.lastName}
                                        </Typography>
                                      </>
                                    ) : enrollment.homeroom ? (
                                      <>
                                        <Typography variant="subtitle2">
                                          Homeroom: {enrollment.homeroom.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          School: {enrollment.homeroom.school?.name || 'Main School'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          Teacher: {enrollment.homeroom.teacher.firstName} {enrollment.homeroom.teacher.lastName}
                                        </Typography>
                                      </>
                                    ) : null}
                                    <Typography variant="body2" color="text.secondary">
                                      Enrolled: {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                  <Chip
                                    label={enrollment.status}
                                    size="small"
                                    color={enrollment.status === 'Active' ? 'success' : 'default'}
                                  />
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">
                  No enrollment history available
                </Alert>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Contacts
                </Typography>
                {canEditStudent && (
                  <Button
                    variant="outlined"
                    size="small"
                    icon={<Edit />}
                    onClick={handleEditEmergency}
                  >
                    Edit Emergency Contact
                  </Button>
                )}
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              {/* Emergency Contact */}
              {student.emergencyContact && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                    Emergency Contact
                  </Typography>
                  <Card variant="outlined" sx={{ backgroundColor: 'error.50' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Warning color="error" />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                            {student.emergencyContact.name || 'Not specified'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Relationship: {student.emergencyContact.relationship || 'Not specified'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Phone fontSize="small" color="action" />
                            <Typography variant="body2">
                              {student.emergencyContact.phone || 'No phone number'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {/* Parent/Guardian Contacts */}
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                Parents/Guardians
              </Typography>
              {student.parents && student.parents.length > 0 ? (
                <Grid container spacing={2}>
                  {student.parents.map((parent: any) => (
                    <Grid item xs={12} md={6} key={parent.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                              {parent.name}
                            </Typography>
                            {parent.isPrimary && (
                              <Chip
                                label="Primary"
                                size="small"
                                color="primary"
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Relationship: {parent.relationship || 'Parent/Guardian'}
                          </Typography>
                          {parent.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                              <Email fontSize="small" color="action" />
                              <Typography variant="body2">
                                {parent.email}
                              </Typography>
                            </Box>
                          )}
                          {parent.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                              <Phone fontSize="small" color="action" />
                              <Typography variant="body2">
                                {parent.phone}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  No parent/guardian information available
                </Alert>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Medical Information
                </Typography>
                {canEditStudent && (
                  <Button
                    variant="outlined"
                    size="small"
                    icon={<Edit />}
                    onClick={handleEditMedical}
                  >
                    Edit Medical Info
                  </Button>
                )}
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              {student.medical ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <LocalHospital color="error" />
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            Medical Conditions
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {student.medical.conditions || 'None reported'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Medication color="primary" />
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            Medications
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {student.medical.medications || 'None reported'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Warning color="warning" />
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            Allergies
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {student.medical.allergies || 'None reported'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <MedicalServices color="error" />
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            Emergency Instructions
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {student.medical.instructions || 'No special instructions'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">
                  No medical information has been recorded for this student.
                </Alert>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
              <Typography variant="h6" gutterBottom>
                Academic History
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                {/* Recent Grades */}
                {student.recentGrades && student.recentGrades.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Assessment color="primary" />
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            Recent Grades
                          </Typography>
                        </Box>
                        <List dense>
                          {student.recentGrades.slice(0, 5).map((grade: any) => (
                            <ListItem key={grade.id} sx={{ px: 0 }}>
                              <ListItemText
                                primary={grade.assignment?.title || 'Assignment'}
                                secondary={`${grade.courseSection?.course?.courseName || 'Course'} - ${grade.letterGrade || grade.numericGrade || 'N/A'}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                
                {/* Recent Attendance */}
                {student.recentAttendance && student.recentAttendance.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <EventAvailable color="primary" />
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            Recent Attendance
                          </Typography>
                        </Box>
                        <List dense>
                          {student.recentAttendance.slice(0, 5).map((attendance: any) => (
                            <ListItem key={attendance.id} sx={{ px: 0 }}>
                              <ListItemText
                                primary={new Date(attendance.date).toLocaleDateString()}
                                secondary={
                                  <Chip
                                    label={attendance.status}
                                    size="small"
                                    color={
                                      attendance.status === 'Present' ? 'success' :
                                      attendance.status === 'Absent' ? 'error' :
                                      'warning'
                                    }
                                  />
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </TabPanel>
          </Paper>

          {/* Medical Information Edit Dialog */}
          <Dialog open={editMedicalDialog} onClose={() => setEditMedicalDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Medical Information</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Medical Conditions"
                    multiline
                    rows={2}
                    value={medicalForm.conditions}
                    onChange={(e) => setMedicalForm({ ...medicalForm, conditions: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Medications"
                    multiline
                    rows={2}
                    value={medicalForm.medications}
                    onChange={(e) => setMedicalForm({ ...medicalForm, medications: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Allergies"
                    multiline
                    rows={2}
                    value={medicalForm.allergies}
                    onChange={(e) => setMedicalForm({ ...medicalForm, allergies: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Emergency Medical Instructions"
                    multiline
                    rows={3}
                    value={medicalForm.instructions}
                    onChange={(e) => setMedicalForm({ ...medicalForm, instructions: e.target.value })}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button
                variant="text"
                onClick={() => setEditMedicalDialog(false)}
                icon={<Cancel />}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => updateMedicalMutation.mutate(medicalForm)}
                icon={<Save />}
                disabled={updateMedicalMutation.isPending}
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>

          {/* Emergency Contact Edit Dialog */}
          <Dialog open={editEmergencyDialog} onClose={() => setEditEmergencyDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Emergency Contact</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contact Name"
                    value={emergencyForm.name}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={emergencyForm.phone}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, phone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Relationship"
                    value={emergencyForm.relationship}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, relationship: e.target.value })}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button
                variant="text"
                onClick={() => setEditEmergencyDialog(false)}
                icon={<Cancel />}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => updateEmergencyMutation.mutate(emergencyForm)}
                icon={<Save />}
                disabled={updateEmergencyMutation.isPending}
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : null}
    </Box>
  );
};