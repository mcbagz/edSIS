import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Alert,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  Add,
  Edit,
  Delete,
  Assignment as AssignmentIcon,
  CalendarToday,
  Assessment,
  Cancel,
  Save,
  ContentCopy,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { gradebookService } from '../../services/gradebookService';
import { Button, useToast } from '../../components';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  category: string;
  type: string;
  dueDate: string;
  maxPoints: number;
  weight?: number;
  courseSectionId: string;
  createdAt: string;
  updatedAt: string;
  gradedCount?: number;
  totalStudents?: number;
}

interface AssignmentFormData {
  title: string;
  description: string;
  category: string;
  type: string;
  dueDate: Dayjs | null;
  maxPoints: number;
  weight: number;
}

interface AssignmentManagementProps {
  courseSectionId: string;
}

const ASSIGNMENT_CATEGORIES = [
  'Homework',
  'Quiz',
  'Test',
  'Project',
  'Participation',
  'Lab',
  'Presentation',
  'Final Exam',
];

const ASSIGNMENT_TYPES = [
  'Regular',
  'Extra Credit',
  'Make-up',
  'Optional',
];

export const AssignmentManagement: React.FC<AssignmentManagementProps> = ({ courseSectionId }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
  
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    description: '',
    category: 'Homework',
    type: 'Regular',
    dueDate: null,
    maxPoints: 100,
    weight: 1,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AssignmentFormData, string>>>({});

  // Fetch assignments for the course section
  const { data: assignments, isLoading, error } = useQuery({
    queryKey: ['assignments', courseSectionId],
    queryFn: () => gradebookService.getAssignmentsByCourseSection(courseSectionId),
    enabled: !!courseSectionId,
  });

  // Create assignment mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => gradebookService.createAssignment({
      ...data,
      courseSectionId,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', courseSectionId] });
      toast.success('Assignment created successfully');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Failed to create assignment');
    },
  });

  // Update assignment mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      gradebookService.updateAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', courseSectionId] });
      toast.success('Assignment updated successfully');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Failed to update assignment');
    },
  });

  // Delete assignment mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => gradebookService.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', courseSectionId] });
      toast.success('Assignment deleted successfully');
      setDeleteDialog(false);
      setAssignmentToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete assignment');
    },
  });

  // Duplicate assignment mutation
  const duplicateMutation = useMutation({
    mutationFn: (assignment: Assignment) => {
      const newAssignment = {
        title: `${assignment.title} (Copy)`,
        description: assignment.description,
        category: assignment.category,
        type: assignment.type,
        dueDate: assignment.dueDate,
        maxPoints: assignment.maxPoints,
        weight: assignment.weight,
        courseSectionId: assignment.courseSectionId,
      };
      return gradebookService.createAssignment(newAssignment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', courseSectionId] });
      toast.success('Assignment duplicated successfully');
    },
    onError: () => {
      toast.error('Failed to duplicate assignment');
    },
  });

  const handleOpenDialog = (assignment?: Assignment) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setFormData({
        title: assignment.title,
        description: assignment.description || '',
        category: assignment.category,
        type: assignment.type,
        dueDate: assignment.dueDate ? dayjs(assignment.dueDate) : null,
        maxPoints: assignment.maxPoints,
        weight: assignment.weight || 1,
      });
    } else {
      setEditingAssignment(null);
      setFormData({
        title: '',
        description: '',
        category: 'Homework',
        type: 'Regular',
        dueDate: null,
        maxPoints: 100,
        weight: 1,
      });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAssignment(null);
    setFormData({
      title: '',
      description: '',
      category: 'Homework',
      type: 'Regular',
      dueDate: null,
      maxPoints: 100,
      weight: 1,
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AssignmentFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }
    if (formData.maxPoints <= 0) {
      newErrors.maxPoints = 'Max points must be greater than 0';
    }
    if (formData.weight < 0) {
      newErrors.weight = 'Weight cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const submitData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      category: formData.category,
      type: formData.type,
      dueDate: formData.dueDate?.toISOString(),
      maxPoints: formData.maxPoints,
      weight: formData.weight,
    };

    if (editingAssignment) {
      updateMutation.mutate({ id: editingAssignment.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (assignment: Assignment) => {
    setAssignmentToDelete(assignment);
    setDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (assignmentToDelete) {
      deleteMutation.mutate(assignmentToDelete.id);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, any> = {
      'Homework': 'primary',
      'Quiz': 'secondary',
      'Test': 'error',
      'Project': 'warning',
      'Participation': 'info',
      'Lab': 'success',
      'Final Exam': 'error',
    };
    return colors[category] || 'default';
  };

  const getCompletionRate = (assignment: Assignment) => {
    if (!assignment.totalStudents || assignment.totalStudents === 0) return 0;
    return Math.round(((assignment.gradedCount || 0) / assignment.totalStudents) * 100);
  };

  if (error) {
    return (
      <Alert severity="error">
        Error loading assignments. Please try again later.
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Assignments</Typography>
          <Button
            variant="contained"
            icon={<Add />}
            iconPosition="start"
            onClick={() => handleOpenDialog()}
          >
            New Assignment
          </Button>
        </Box>

        {isLoading ? (
          <Paper sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={400} />
          </Paper>
        ) : assignments && assignments.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell align="center">Max Points</TableCell>
                  <TableCell align="center">Weight</TableCell>
                  <TableCell align="center">Graded</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.map((assignment: Assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignmentIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {assignment.title}
                          </Typography>
                          {assignment.description && (
                            <Typography variant="caption" color="text.secondary">
                              {assignment.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={assignment.category}
                        size="small"
                        color={getCategoryColor(assignment.category)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{assignment.type}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2">
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{assignment.maxPoints}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{assignment.weight || 1}x</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Assessment fontSize="small" color="action" />
                        <Typography variant="body2">
                          {assignment.gradedCount || 0}/{assignment.totalStudents || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({getCompletionRate(assignment)}%)
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(assignment)}
                        title="Edit"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => duplicateMutation.mutate(assignment)}
                        title="Duplicate"
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(assignment)}
                        color="error"
                        title="Delete"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Assignments Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first assignment to start grading students
            </Typography>
            <Button
              variant="contained"
              icon={<Add />}
              iconPosition="start"
              onClick={() => handleOpenDialog()}
            >
              Create First Assignment
            </Button>
          </Paper>
        )}

        {/* Assignment Form Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingAssignment ? 'Edit Assignment' : 'New Assignment'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  error={!!errors.title}
                  helperText={errors.title}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    label="Category"
                  >
                    {ASSIGNMENT_CATEGORIES.map(category => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    label="Type"
                  >
                    {ASSIGNMENT_TYPES.map(type => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <DateTimePicker
                  label="Due Date"
                  value={formData.dueDate}
                  onChange={(date) => setFormData({ ...formData, dueDate: date })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.dueDate,
                      helperText: errors.dueDate,
                      required: true,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Points"
                  type="number"
                  value={formData.maxPoints}
                  onChange={(e) => setFormData({ ...formData, maxPoints: Number(e.target.value) })}
                  error={!!errors.maxPoints}
                  helperText={errors.maxPoints}
                  required
                  InputProps={{
                    inputProps: { min: 1 }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                  error={!!errors.weight}
                  helperText={errors.weight || 'Multiplier for grade calculation'}
                  InputProps={{
                    inputProps: { min: 0, step: 0.5 },
                    endAdornment: <InputAdornment position="end">x</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              variant="text"
              onClick={handleCloseDialog}
              icon={<Cancel />}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              icon={<Save />}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingAssignment ? 'Save Changes' : 'Create Assignment'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
          <DialogTitle>Delete Assignment</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{assignmentToDelete?.title}"? 
              This will also delete all grades associated with this assignment.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button variant="text" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AssignmentManagement;