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
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useToast } from '../../components/molecules/Toast';
import { getSections, createSection, updateSection, deleteSection } from '../../services/courseService';
import { getCourses } from '../../services/courseService';
import { checkTeacherAvailability, checkRoomAvailability } from '../../services/schedulingService';
import { getStaff } from '../../services/staffService';
import { getSchools, getCurrentSession } from '../../services/schoolService';

const periods = ['1st Period', '2nd Period', '3rd Period', '4th Period', '5th Period', '6th Period', '7th Period', '8th Period'];
const daysOfWeek = ['M', 'T', 'W', 'Th', 'F'];
const timeSlots = [
  '8:00 AM - 8:50 AM',
  '9:00 AM - 9:50 AM',
  '10:00 AM - 10:50 AM',
  '11:00 AM - 11:50 AM',
  '12:00 PM - 12:50 PM',
  '1:00 PM - 1:50 PM',
  '2:00 PM - 2:50 PM',
  '3:00 PM - 3:50 PM'
];

export const MasterSchedule: React.FC = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [availabilityWarning, setAvailabilityWarning] = useState('');
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    courseId: '',
    sectionIdentifier: '',
    teacherId: '',
    roomNumber: '',
    period: '',
    time: '',
    days: [] as string[],
    maxStudents: 30
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sectionsData, coursesData, staffData, schoolsData, sessionData] = await Promise.all([
        getSections(),
        getCourses(),
        getStaff(),
        getSchools(),
        getCurrentSession()
      ]);
      setSections(sectionsData);
      setCourses(coursesData);
      setTeachers(staffData);
      setSchools(schoolsData);
      setCurrentSession(sessionData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      if (showToast) {
        showToast('Failed to fetch data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (section?: any) => {
    if (section) {
      setEditingSection(section);
      setFormData({
        courseId: section.courseId,
        sectionIdentifier: section.sectionIdentifier,
        teacherId: section.teacherId,
        roomNumber: section.roomNumber || '',
        period: section.period || '',
        time: section.time || '',
        days: section.days || [],
        maxStudents: section.maxStudents
      });
    } else {
      setEditingSection(null);
      setFormData({
        courseId: '',
        sectionIdentifier: '',
        teacherId: '',
        roomNumber: '',
        period: '',
        time: '',
        days: [],
        maxStudents: 30
      });
    }
    setAvailabilityWarning('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSection(null);
    setAvailabilityWarning('');
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const checkAvailability = async () => {
    const schoolId = schools.length > 0 ? schools[0].id : null;
    const sessionId = currentSession?.id;
    
    if (!schoolId || !sessionId) {
      return false;
    }
    
    try {
      // Check teacher availability
      if (formData.teacherId && formData.days.length && (formData.time || formData.period)) {
        const teacherAvail = await checkTeacherAvailability({
          teacherId: formData.teacherId,
          days: formData.days,
          time: formData.time,
          period: formData.period,
          sessionId,
          excludeSectionId: editingSection?.id
        });
        
        if (!teacherAvail.available) {
          setAvailabilityWarning('Teacher is not available at this time');
          return false;
        }
      }
      
      // Check room availability
      if (formData.roomNumber && formData.days.length && (formData.time || formData.period)) {
        const roomAvail = await checkRoomAvailability({
          roomNumber: formData.roomNumber,
          days: formData.days,
          time: formData.time,
          period: formData.period,
          sessionId,
          excludeSectionId: editingSection?.id
        });
        
        if (!roomAvail.available) {
          setAvailabilityWarning('Room is not available at this time');
          return false;
        }
      }
      
      setAvailabilityWarning('');
      return true;
    } catch (error) {
      console.error('Error checking availability:', error);
      return true; // Allow submission if check fails
    }
  };

  const handleSubmit = async () => {
    const isAvailable = await checkAvailability();
    if (!isAvailable && availabilityWarning) {
      return;
    }
    
    try {
      const schoolId = schools.length > 0 ? schools[0].id : null;
      const sessionId = currentSession?.id;
      
      if (!schoolId || !sessionId) {
        if (showToast) {
          showToast('School or session not found. Please configure the system first.', 'error');
        }
        return;
      }
      
      if (editingSection) {
        await updateSection(editingSection.id, formData);
        if (showToast) {
          showToast('Section updated successfully', 'success');
        }
      } else {
        console.log('Creating section with data:', { 
          ...formData, 
          schoolId,
          sessionId 
        });
        await createSection({ 
          ...formData, 
          schoolId,
          sessionId 
        });
        if (showToast) {
          showToast('Section created successfully', 'success');
        }
      }
      handleCloseDialog();
      fetchData();
    } catch (error: any) {
      console.error('Error saving section:', error);
      if (showToast) {
        showToast(error.response?.data?.error || 'Failed to save section', 'error');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      try {
        await deleteSection(id);
        if (showToast) {
          showToast('Section deleted successfully', 'success');
        }
        fetchData();
      } catch (error: any) {
        console.error('Error deleting section:', error);
        if (showToast) {
          showToast(error.response?.data?.error || 'Failed to delete section', 'error');
        }
      }
    }
  };

  const filteredSections = sections.filter(section => {
    const matchesCourse = !selectedCourse || section.courseId === selectedCourse;
    const matchesTeacher = !selectedTeacher || section.teacherId === selectedTeacher;
    const matchesPeriod = !selectedPeriod || section.period === selectedPeriod;
    return matchesCourse && matchesTeacher && matchesPeriod;
  });

  const getDayString = (days: string[]) => {
    if (!days || days.length === 0) return '-';
    return days.join(', ');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon />
          Master Schedule
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Section
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Course</InputLabel>
                <Select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  label="Filter by Course"
                >
                  <MenuItem value="">All Courses</MenuItem>
                  {courses.map(course => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.courseCode} - {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Teacher</InputLabel>
                <Select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  label="Filter by Teacher"
                >
                  <MenuItem value="">All Teachers</MenuItem>
                  {teachers.map(teacher => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Period</InputLabel>
                <Select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  label="Filter by Period"
                >
                  <MenuItem value="">All Periods</MenuItem>
                  {periods.map(period => (
                    <MenuItem key={period} value={period}>{period}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Section</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Teacher</TableCell>
              <TableCell>Room</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Days</TableCell>
              <TableCell>Enrollment</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">Loading...</TableCell>
              </TableRow>
            ) : filteredSections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">No sections found</TableCell>
              </TableRow>
            ) : (
              filteredSections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell>{section.sectionIdentifier}</TableCell>
                  <TableCell>
                    {section.course?.courseCode} - {section.course?.name}
                  </TableCell>
                  <TableCell>
                    {section.teacher?.firstName} {section.teacher?.lastName}
                  </TableCell>
                  <TableCell>{section.roomNumber || '-'}</TableCell>
                  <TableCell>{section.period || '-'}</TableCell>
                  <TableCell>{section.time || '-'}</TableCell>
                  <TableCell>{getDayString(section.days)}</TableCell>
                  <TableCell>
                    {section.currentEnrollment}/{section.maxStudents}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(section)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(section.id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Section Form Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSection ? 'Edit Section' : 'Add New Section'}
        </DialogTitle>
        <DialogContent>
          {availabilityWarning && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <WarningIcon />
                <Typography>{availabilityWarning}</Typography>
              </Stack>
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Course</InputLabel>
                <Select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  label="Course"
                >
                  {courses.map(course => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.courseCode} - {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Section Identifier"
                value={formData.sectionIdentifier}
                onChange={(e) => setFormData({ ...formData, sectionIdentifier: e.target.value })}
                placeholder="e.g., A, B, 01"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Teacher</InputLabel>
                <Select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  label="Teacher"
                >
                  {teachers.map(teacher => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Room Number"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="e.g., 101, Lab A"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Period</InputLabel>
                <Select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  label="Period"
                >
                  <MenuItem value="">None</MenuItem>
                  {periods.map(period => (
                    <MenuItem key={period} value={period}>{period}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Time Slot</InputLabel>
                <Select
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  label="Time Slot"
                >
                  <MenuItem value="">None</MenuItem>
                  {timeSlots.map(time => (
                    <MenuItem key={time} value={time}>{time}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Days of Week</Typography>
              <FormGroup row>
                {daysOfWeek.map(day => (
                  <FormControlLabel
                    key={day}
                    control={
                      <Checkbox
                        checked={formData.days.includes(day)}
                        onChange={() => handleDayToggle(day)}
                      />
                    }
                    label={day}
                  />
                ))}
              </FormGroup>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Students"
                type="number"
                value={formData.maxStudents}
                onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!!availabilityWarning}
          >
            {editingSection ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};