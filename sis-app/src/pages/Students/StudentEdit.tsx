import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Grid,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Cancel,
  Person,
  School,
  ContactPhone,
  LocalHospital,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Breadcrumbs, useToast } from '../../components';
import { hasPermission } from '../../utils/permissions';

interface StudentFormData {
  firstName: string;
  lastName: string;
  middleName: string;
  birthDate: Dayjs | null;
  gender: string;
  ethnicity: string;
  gradeLevel: string;
  enrollmentStatus: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  medicalConditions: string;
  medications: string;
  allergies: string;
  emergencyMedicalInstructions: string;
}

const GRADE_LEVELS = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const ENROLLMENT_STATUSES = ['Active', 'Inactive', 'Graduated', 'Transferred', 'Withdrawn'];

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const ETHNICITY_OPTIONS = [
  'American Indian or Alaska Native',
  'Asian',
  'Black or African American',
  'Hispanic or Latino',
  'Native Hawaiian or Other Pacific Islander',
  'White',
  'Two or More Races',
  'Prefer not to say',
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

export const StudentEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const isNewStudent = !id;

  const [formData, setFormData] = useState<StudentFormData>({
    firstName: '',
    lastName: '',
    middleName: '',
    birthDate: null,
    gender: '',
    ethnicity: '',
    gradeLevel: '',
    enrollmentStatus: 'Active',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    medicalConditions: '',
    medications: '',
    allergies: '',
    emergencyMedicalInstructions: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({});

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentService.getStudentById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName || '',
        lastName: student.lastName || student.lastSurname || '',
        middleName: student.middleName || '',
        birthDate: student.birthDate ? dayjs(student.birthDate) : null,
        gender: student.birthSex || student.gender || '',
        ethnicity: student.ethnicity || '',
        gradeLevel: student.gradeLevel || '',
        enrollmentStatus: student.enrollmentStatus || 'Active',
        email: student.email || '',
        phone: student.phone || '',
        address: student.address || '',
        city: student.city || '',
        state: student.state || '',
        zipCode: student.zipCode || '',
        emergencyContactName: student.emergencyContact?.name || '',
        emergencyContactPhone: student.emergencyContact?.phone || '',
        emergencyContactRelation: student.emergencyContact?.relationship || '',
        medicalConditions: student.medical?.conditions || '',
        medications: student.medical?.medications || '',
        allergies: student.medical?.allergies || '',
        emergencyMedicalInstructions: student.medical?.instructions || '',
      });
    }
  }, [student]);

  const createMutation = useMutation({
    mutationFn: (data: any) => studentService.createStudent(data),
    onSuccess: (newStudent) => {
      toast.success('Student created successfully');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      navigate(`/students/${newStudent.id}`);
    },
    onError: () => {
      toast.error('Failed to create student');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => studentService.updateStudent(id!, data),
    onSuccess: () => {
      toast.success('Student updated successfully');
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      navigate(`/students/${id}`);
    },
    onError: () => {
      toast.error('Failed to update student');
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof StudentFormData, string>> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.birthDate) {
      newErrors.birthDate = 'Birth date is required';
    }
    if (!formData.gradeLevel) {
      newErrors.gradeLevel = 'Grade level is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.phone && !/^\+?[\d\s()-]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format';
    }
    if (formData.zipCode && !/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Invalid ZIP code format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    const submitData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      middleName: formData.middleName.trim() || null,
      birthDate: formData.birthDate?.toISOString() || '',
      gender: formData.gender || null,
      ethnicity: formData.ethnicity || null,
      gradeLevel: formData.gradeLevel,
      enrollmentStatus: formData.enrollmentStatus,
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      address: formData.address.trim() || null,
      city: formData.city.trim() || null,
      state: formData.state || null,
      zipCode: formData.zipCode.trim() || null,
      emergencyContactName: formData.emergencyContactName.trim() || null,
      emergencyContactPhone: formData.emergencyContactPhone.trim() || null,
      emergencyContactRelation: formData.emergencyContactRelation.trim() || null,
      medicalConditions: formData.medicalConditions.trim() || null,
      medications: formData.medications.trim() || null,
      allergies: formData.allergies.trim() || null,
      emergencyMedicalInstructions: formData.emergencyMedicalInstructions.trim() || null,
    };

    if (isNewStudent) {
      createMutation.mutate(submitData);
    } else {
      updateMutation.mutate(submitData);
    }
  };

  const handleFieldChange = (field: keyof StudentFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: any } }
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDateChange = (date: Dayjs | null) => {
    setFormData(prev => ({ ...prev, birthDate: date }));
    if (errors.birthDate) {
      setErrors(prev => ({ ...prev, birthDate: '' }));
    }
  };

  const canEditStudent = hasPermission(user?.role, 'students.edit');

  if (!canEditStudent) {
    return (
      <Box>
        <Alert severity="error">
          You do not have permission to edit student information.
        </Alert>
        <Button
          variant="text"
          icon={<ArrowBack />}
          iconPosition="start"
          onClick={() => navigate('/students')}
          sx={{ mt: 2 }}
        >
          Back to Students
        </Button>
      </Box>
    );
  }

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Students', path: '/students' },
    ...(id ? [
      { label: student ? `${student.firstName} ${student.lastSurname}` : 'Student', path: `/students/${id}` },
      { label: 'Edit' },
    ] : [
      { label: 'New Student' },
    ]),
  ];

  if (isLoading && !isNewStudent) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Breadcrumbs items={breadcrumbItems} sx={{ mb: 2 }} />
        
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            {isNewStudent ? 'New Student' : 'Edit Student'}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Personal Information */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Person sx={{ mr: 1 }} />
                  <Typography variant="h6">Personal Information</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={formData.firstName}
                      onChange={handleFieldChange('firstName')}
                      error={!!errors.firstName}
                      helperText={errors.firstName}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Middle Name"
                      value={formData.middleName}
                      onChange={handleFieldChange('middleName')}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={formData.lastName}
                      onChange={handleFieldChange('lastName')}
                      error={!!errors.lastName}
                      helperText={errors.lastName}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <DatePicker
                      label="Birth Date"
                      value={formData.birthDate}
                      onChange={handleDateChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.birthDate,
                          helperText: errors.birthDate,
                          required: true,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Gender</InputLabel>
                      <Select
                        value={formData.gender}
                        onChange={handleFieldChange('gender')}
                        label="Gender"
                      >
                        <MenuItem value="">Select Gender</MenuItem>
                        {GENDER_OPTIONS.map(gender => (
                          <MenuItem key={gender} value={gender}>
                            {gender}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Ethnicity</InputLabel>
                      <Select
                        value={formData.ethnicity}
                        onChange={handleFieldChange('ethnicity')}
                        label="Ethnicity"
                      >
                        <MenuItem value="">Select Ethnicity</MenuItem>
                        {ETHNICITY_OPTIONS.map(ethnicity => (
                          <MenuItem key={ethnicity} value={ethnicity}>
                            {ethnicity}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Academic Information */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <School sx={{ mr: 1 }} />
                  <Typography variant="h6">Academic Information</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required error={!!errors.gradeLevel}>
                      <InputLabel>Grade Level</InputLabel>
                      <Select
                        value={formData.gradeLevel}
                        onChange={handleFieldChange('gradeLevel')}
                        label="Grade Level"
                      >
                        <MenuItem value="">Select Grade</MenuItem>
                        {GRADE_LEVELS.map(grade => (
                          <MenuItem key={grade} value={grade}>
                            Grade {grade}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.gradeLevel && (
                        <FormHelperText>{errors.gradeLevel}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Enrollment Status</InputLabel>
                      <Select
                        value={formData.enrollmentStatus}
                        onChange={handleFieldChange('enrollmentStatus')}
                        label="Enrollment Status"
                      >
                        {ENROLLMENT_STATUSES.map(status => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <ContactPhone sx={{ mr: 1 }} />
                  <Typography variant="h6">Contact Information</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={handleFieldChange('email')}
                      error={!!errors.email}
                      helperText={errors.email}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={formData.phone}
                      onChange={handleFieldChange('phone')}
                      error={!!errors.phone}
                      helperText={errors.phone}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Street Address"
                      value={formData.address}
                      onChange={handleFieldChange('address')}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="City"
                      value={formData.city}
                      onChange={handleFieldChange('city')}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>State</InputLabel>
                      <Select
                        value={formData.state}
                        onChange={handleFieldChange('state')}
                        label="State"
                      >
                        <MenuItem value="">Select State</MenuItem>
                        {US_STATES.map(state => (
                          <MenuItem key={state} value={state}>
                            {state}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="ZIP Code"
                      value={formData.zipCode}
                      onChange={handleFieldChange('zipCode')}
                      error={!!errors.zipCode}
                      helperText={errors.zipCode}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Emergency Contact */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <ContactPhone sx={{ mr: 1, color: 'error.main' }} />
                  <Typography variant="h6">Emergency Contact</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Contact Name"
                      value={formData.emergencyContactName}
                      onChange={handleFieldChange('emergencyContactName')}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Contact Phone"
                      value={formData.emergencyContactPhone}
                      onChange={handleFieldChange('emergencyContactPhone')}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Relationship"
                      value={formData.emergencyContactRelation}
                      onChange={handleFieldChange('emergencyContactRelation')}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Medical Information */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <LocalHospital sx={{ mr: 1 }} />
                  <Typography variant="h6">Medical Information</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Medical Conditions"
                      multiline
                      rows={3}
                      value={formData.medicalConditions}
                      onChange={handleFieldChange('medicalConditions')}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Medications"
                      multiline
                      rows={3}
                      value={formData.medications}
                      onChange={handleFieldChange('medications')}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Allergies"
                      multiline
                      rows={3}
                      value={formData.allergies}
                      onChange={handleFieldChange('allergies')}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Emergency Medical Instructions"
                      multiline
                      rows={3}
                      value={formData.emergencyMedicalInstructions}
                      onChange={handleFieldChange('emergencyMedicalInstructions')}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  icon={<Cancel />}
                  onClick={() => navigate(id ? `/students/${id}` : '/students')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  icon={<Save />}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {isNewStudent ? 'Create Student' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </LocalizationProvider>
  );
};