import React, { useState, useEffect } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
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
  Alert,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useToast } from '../../components/molecules/Toast';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../../services/courseService';

interface Course {
  id: string;
  schoolId: string;
  courseCode: string;
  name: string;
  description?: string;
  credits: number;
  department?: string;
  gradeLevel: string[];
  prerequisites: string[];
  capacity?: number;
  _count?: {
    courseSections: number;
  };
}

const gradeLevels = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const departments = ['Mathematics', 'Science', 'English', 'Social Studies', 'Arts', 'Physical Education', 'Technology', 'Foreign Language'];

export const CourseCatalog: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    courseCode: '',
    name: '',
    description: '',
    credits: 1,
    department: '',
    gradeLevel: [] as string[],
    prerequisites: [] as string[],
    capacity: 30
  });

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

  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        courseCode: course.courseCode,
        name: course.name,
        description: course.description || '',
        credits: course.credits,
        department: course.department || '',
        gradeLevel: course.gradeLevel,
        prerequisites: course.prerequisites,
        capacity: course.capacity || 30
      });
    } else {
      setEditingCourse(null);
      setFormData({
        courseCode: '',
        name: '',
        description: '',
        credits: 1,
        department: '',
        gradeLevel: [],
        prerequisites: [],
        capacity: 30
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCourse(null);
  };

  const handleGradeLevelChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFormData({
      ...formData,
      gradeLevel: typeof value === 'string' ? value.split(',') : value
    });
  };

  const handleSubmit = async () => {
    try {
      const schoolId = localStorage.getItem('schoolId') || '550e8400-e29b-41d4-a716-446655440000';
      
      if (editingCourse) {
        await updateCourse(editingCourse.id, formData);
        showToast('Course updated successfully', 'success');
      } else {
        await createCourse({ ...formData, schoolId });
        showToast('Course created successfully', 'success');
      }
      handleCloseDialog();
      fetchCourses();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to save course', 'error');
    }
  };

  const handleDeleteClick = (course: Course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (courseToDelete) {
      try {
        await deleteCourse(courseToDelete.id);
        showToast('Course deleted successfully', 'success');
        fetchCourses();
      } catch (error: any) {
        showToast(error.response?.data?.error || 'Failed to delete course', 'error');
      } finally {
        setDeleteDialogOpen(false);
        setCourseToDelete(null);
      }
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = !search || 
      course.name.toLowerCase().includes(search.toLowerCase()) ||
      course.courseCode.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = !selectedDepartment || course.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon />
          Course Catalog
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Course
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  label="Department"
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
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
              <TableCell>Course Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Credits</TableCell>
              <TableCell>Grade Levels</TableCell>
              <TableCell>Sections</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : filteredCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No courses found</TableCell>
              </TableRow>
            ) : (
              filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{course.courseCode}</TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell>{course.department || '-'}</TableCell>
                  <TableCell>{course.credits}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {course.gradeLevel.map(grade => (
                        <Chip key={grade} label={grade} size="small" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>{course._count?.courseSections || 0}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(course)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteClick(course)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Course Form Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCourse ? 'Edit Course' : 'Add New Course'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Course Code"
                value={formData.courseCode}
                onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Course Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Credits"
                type="number"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: parseFloat(e.target.value) })}
                inputProps={{ min: 0.5, max: 6, step: 0.5 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  label="Department"
                >
                  <MenuItem value="">None</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Max Students per Section"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Grade Levels</InputLabel>
                <Select
                  multiple
                  value={formData.gradeLevel}
                  onChange={handleGradeLevelChange}
                  input={<OutlinedInput label="Grade Levels" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {gradeLevels.map((grade) => (
                    <MenuItem key={grade} value={grade}>
                      Grade {grade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCourse ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          {courseToDelete?._count?.courseSections ? (
            <Alert severity="warning">
              This course has {courseToDelete._count.courseSections} section(s). 
              Please delete all sections before deleting the course.
            </Alert>
          ) : (
            <Typography>
              Are you sure you want to delete the course "{courseToDelete?.name}"?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          {!courseToDelete?._count?.courseSections && (
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};