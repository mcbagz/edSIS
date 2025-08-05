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
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
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
  const [tabValue, setTabValue] = useState(0);

  const { data: student, isLoading, error } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentService.getStudentById(id!),
    enabled: !!id,
  });

  const { data: schoolAssociations } = useQuery({
    queryKey: ['studentSchoolAssociations', student?.studentUniqueId],
    queryFn: () => studentService.getStudentSchoolAssociations(student!.studentUniqueId),
    enabled: !!student?.studentUniqueId,
  });

  const { data: parentAssociations } = useQuery({
    queryKey: ['studentParentAssociations', student?.studentUniqueId],
    queryFn: () => studentService.getStudentParentAssociations(student!.studentUniqueId),
    enabled: !!student?.studentUniqueId,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
                    {student.firstName} {student.middleName} {student.lastSurname}
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
                    {student.birthSexDescriptor && (
                      <Chip
                        label={student.birthSexDescriptor.replace('http://ed-fi.org/BirthSexDescriptor#', '')}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    <Chip
                      label="Active"
                      size="small"
                      color="success"
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
                    {student.firstName} {student.middleName} {student.lastSurname}
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
                    Birth Sex
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {student.birthSexDescriptor?.replace('http://ed-fi.org/BirthSexDescriptor#', '') || 'Not specified'}
                  </Typography>
                </Grid>
                {student.studentIdentificationCodes?.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Other Identification
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {student.studentIdentificationCodes.map((code, index) => (
                        <Chip
                          key={index}
                          label={`${code.studentIdentificationSystemDescriptor}: ${code.identificationCode}`}
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
                School Associations
              </Typography>
              <Divider sx={{ mb: 3 }} />
              {schoolAssociations && schoolAssociations.length > 0 ? (
                <Grid container spacing={2}>
                  {schoolAssociations.map((association: any, index: number) => (
                    <Grid item xs={12} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <Box>
                              <Typography variant="h6" gutterBottom>
                                School ID: {association.schoolReference?.schoolId || 'Unknown'}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <CalendarToday fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    Entry Date: {new Date(association.entryDate).toLocaleDateString()}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <School fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    Grade Level: {association.entryGradeLevelDescriptor?.replace('http://ed-fi.org/GradeLevelDescriptor#', '') || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                            <Chip
                              label="Current"
                              size="small"
                              color="primary"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  No enrollment information available
                </Alert>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Parent/Guardian Contacts
              </Typography>
              <Divider sx={{ mb: 3 }} />
              {parentAssociations && parentAssociations.length > 0 ? (
                <Grid container spacing={2}>
                  {parentAssociations.map((association: any, index: number) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                            <Typography variant="h6">
                              Parent ID: {association.parentReference?.parentUniqueId || 'Unknown'}
                            </Typography>
                            {association.primaryContactStatus && (
                              <Chip
                                label="Primary"
                                size="small"
                                color="primary"
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Relationship: {association.relationDescriptor?.replace('http://ed-fi.org/RelationDescriptor#', '') || 'N/A'}
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              Note: Contact details not available in current API
                            </Typography>
                          </Box>
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
              <Typography variant="h6" gutterBottom>
                Medical Information
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Alert severity="info">
                Medical information is not available through the current Ed-Fi API endpoints.
              </Alert>
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
              <Typography variant="h6" gutterBottom>
                Enrollment History
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Alert severity="info">
                Historical enrollment data is not available through the current Ed-Fi API endpoints.
              </Alert>
            </TabPanel>
          </Paper>
        </>
      ) : null}
    </Box>
  );
};