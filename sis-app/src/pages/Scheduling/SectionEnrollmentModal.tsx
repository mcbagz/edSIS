import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Autocomplete,
  Paper,
  Grid,
} from '@mui/material';
import {
  Close,
  Search,
  PersonAdd,
  PersonRemove,
  School,
  Group,
  CheckCircle,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, useToast } from '../../components';
import { enrollmentService } from '../../services/enrollmentService';
import { studentService } from '../../services/studentService';

interface SectionEnrollmentModalProps {
  open: boolean;
  onClose: () => void;
  section: {
    id: string;
    sectionIdentifier: string;
    course?: {
      id: string;
      courseCode: string;
      name: string;
    };
    teacher?: {
      id: string;
      firstName: string;
      lastName: string;
    };
    period?: string;
    roomNumber?: string;
    currentEnrollment: number;
    maxStudents: number;
  } | null;
}

interface EnrolledStudent {
  id: string;
  student: {
    id: string;
    studentUniqueId: string;
    firstName: string;
    lastName: string;
    gradeLevel: string;
    email?: string;
  };
  enrollmentDate: string;
  status: string;
}

interface AvailableStudent {
  id: string;
  studentUniqueId: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  email?: string;
}

export const SectionEnrollmentModal: React.FC<SectionEnrollmentModalProps> = ({
  open,
  onClose,
  section,
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<AvailableStudent | null>(null);

  // Fetch enrolled students for this section
  const { data: enrolledStudents, isLoading: loadingEnrolled } = useQuery({
    queryKey: ['sectionEnrollments', section?.id],
    queryFn: () => enrollmentService.getSectionEnrollments(section!.id),
    enabled: !!section?.id && open,
  });

  // Fetch available students (not enrolled in this section)
  const { data: availableStudents, isLoading: loadingAvailable } = useQuery({
    queryKey: ['availableStudents', section?.id],
    queryFn: async () => {
      // Get all students
      const allStudentsResponse = await studentService.getStudents({ 
        enrollmentStatus: 'Active',
        limit: 1000 
      });
      
      // Filter out students already enrolled in this section
      const enrolledIds = enrolledStudents?.map((e: EnrolledStudent) => e.student.id) || [];
      return allStudentsResponse.students.filter(
        (student: any) => !enrolledIds.includes(student.id)
      );
    },
    enabled: !!section?.id && open && !!enrolledStudents,
  });

  // Add student to section mutation
  const addStudentMutation = useMutation({
    mutationFn: (studentId: string) => 
      enrollmentService.enrollStudentInSection({
        studentId,
        courseSectionId: section!.id,
        status: 'Active',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectionEnrollments', section?.id] });
      queryClient.invalidateQueries({ queryKey: ['availableStudents', section?.id] });
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      toast.success('Student enrolled successfully');
      setSelectedStudent(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to enroll student');
    },
  });

  // Remove student from section mutation
  const removeStudentMutation = useMutation({
    mutationFn: (enrollmentId: string) => 
      enrollmentService.unenrollStudent(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectionEnrollments', section?.id] });
      queryClient.invalidateQueries({ queryKey: ['availableStudents', section?.id] });
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      toast.success('Student removed from section');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove student');
    },
  });

  const handleAddStudent = () => {
    if (selectedStudent && section) {
      if (section.currentEnrollment >= section.maxStudents) {
        toast.error('Section is at maximum capacity');
        return;
      }
      addStudentMutation.mutate(selectedStudent.id);
    }
  };

  const handleRemoveStudent = (enrollmentId: string) => {
    if (window.confirm('Are you sure you want to remove this student from the section?')) {
      removeStudentMutation.mutate(enrollmentId);
    }
  };

  // Filter enrolled students based on search
  const filteredEnrolledStudents = enrolledStudents?.filter((enrollment: EnrolledStudent) => {
    const student = enrollment.student;
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      student.studentUniqueId.toLowerCase().includes(query) ||
      student.gradeLevel?.toLowerCase().includes(query)
    );
  });

  // Sort enrolled students alphabetically by last name
  const sortedEnrolledStudents = filteredEnrolledStudents?.sort(
    (a: EnrolledStudent, b: EnrolledStudent) => {
      const lastNameA = a.student.lastName.toLowerCase();
      const lastNameB = b.student.lastName.toLowerCase();
      if (lastNameA < lastNameB) return -1;
      if (lastNameA > lastNameB) return 1;
      // If last names are equal, sort by first name
      const firstNameA = a.student.firstName.toLowerCase();
      const firstNameB = b.student.firstName.toLowerCase();
      if (firstNameA < firstNameB) return -1;
      if (firstNameA > firstNameB) return 1;
      return 0;
    }
  );

  if (!section) return null;

  const isAtCapacity = section.currentEnrollment >= section.maxStudents;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">
              Manage Section Enrollment
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {section.course?.courseCode} - {section.course?.name} (Section {section.sectionIdentifier})
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Section Info */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Teacher</Typography>
                      <Typography variant="body2">
                        {section.teacher?.firstName} {section.teacher?.lastName}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Group fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Enrollment</Typography>
                      <Typography variant="body2">
                        {section.currentEnrollment} / {section.maxStudents} students
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Period</Typography>
                    <Typography variant="body2">{section.period || 'Not set'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Room</Typography>
                    <Typography variant="body2">{section.roomNumber || 'Not assigned'}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Add Student Section */}
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                Add Student to Section
              </Typography>
              {isAtCapacity ? (
                <Alert severity="warning">
                  This section is at maximum capacity. Remove a student before adding new ones.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Autocomplete
                    sx={{ flex: 1 }}
                    options={availableStudents || []}
                    getOptionLabel={(option: AvailableStudent) => 
                      `${option.lastName}, ${option.firstName} (${option.studentUniqueId}) - Grade ${option.gradeLevel}`
                    }
                    value={selectedStudent}
                    onChange={(_, newValue) => setSelectedStudent(newValue)}
                    loading={loadingAvailable}
                    disabled={isAtCapacity}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search for student to add"
                        placeholder="Type student name or ID..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <Search />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option: AvailableStudent) => (
                      <Box component="li" {...props}>
                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                          {option.firstName[0]}{option.lastName[0]}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2">
                            {option.lastName}, {option.firstName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {option.studentUniqueId} | Grade {option.gradeLevel}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  />
                  <Button
                    variant="contained"
                    icon={<PersonAdd />}
                    onClick={handleAddStudent}
                    disabled={!selectedStudent || addStudentMutation.isPending}
                  >
                    Add
                  </Button>
                </Box>
              )}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Enrolled Students List */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Enrolled Students ({sortedEnrolledStudents?.length || 0})
              </Typography>
              <TextField
                size="small"
                placeholder="Search enrolled students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 300 }}
              />
            </Box>

            {loadingEnrolled ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : sortedEnrolledStudents?.length === 0 ? (
              <Alert severity="info">
                {searchQuery 
                  ? 'No students found matching your search.'
                  : 'No students enrolled in this section yet.'}
              </Alert>
            ) : (
              <Paper variant="outlined">
                <List>
                  {sortedEnrolledStudents?.map((enrollment: EnrolledStudent, index: number) => (
                    <React.Fragment key={enrollment.id}>
                      {index > 0 && <Divider />}
                      <ListItem>
                        <Avatar sx={{ mr: 2 }}>
                          {enrollment.student.firstName[0]}{enrollment.student.lastName[0]}
                        </Avatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1">
                                {enrollment.student.lastName}, {enrollment.student.firstName}
                              </Typography>
                              {enrollment.status === 'Active' && (
                                <CheckCircle fontSize="small" color="success" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                              <Chip
                                label={`ID: ${enrollment.student.studentUniqueId}`}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={`Grade ${enrollment.student.gradeLevel}`}
                                size="small"
                                variant="outlined"
                              />
                              {enrollment.student.email && (
                                <Typography variant="caption" color="text.secondary">
                                  {enrollment.student.email}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveStudent(enrollment.id)}
                            color="error"
                            disabled={removeStudentMutation.isPending}
                            title="Remove from section"
                          >
                            <PersonRemove />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button variant="text" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SectionEnrollmentModal;