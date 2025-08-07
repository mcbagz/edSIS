import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams, GridCellParams } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { format } from 'date-fns';
import gradebookService from '../../services/gradebookService';
import type { Assignment, GradebookData, Grade } from '../../services/gradebookService';

interface TeacherGradebookProps {
  courseSectionId: string;
}

const TeacherGradebook: React.FC<TeacherGradebookProps> = ({ courseSectionId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gradebookData, setGradebookData] = useState<GradebookData | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    type: 'Homework' as const,
    dueDate: new Date(),
    maxPoints: 100,
    weight: 1.0,
    category: 'Homework'
  });

  // Auto-save functionality
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const pendingGradeUpdates = useRef<Map<string, any>>(new Map());

  // Load gradebook data
  const loadGradebook = useCallback(async () => {
    try {
      setLoading(true);
      const data = await gradebookService.getGradebook(courseSectionId);
      setGradebookData(data);
      setAssignments(data.assignments);
      setError(null);
    } catch (err) {
      setError('Failed to load gradebook');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseSectionId]);

  useEffect(() => {
    loadGradebook();
  }, [loadGradebook]);

  // Auto-save grades
  const autoSaveGrades = useCallback(async () => {
    if (pendingGradeUpdates.current.size === 0) return;

    setSaving(true);
    const updates = Array.from(pendingGradeUpdates.current.values());
    pendingGradeUpdates.current.clear();

    try {
      await Promise.all(
        updates.map(update => 
          gradebookService.upsertGrade(update)
        )
      );
      setSuccess('Grades saved automatically');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save grades');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, []);

  // Handle grade change with debounced auto-save
  const handleGradeChange = useCallback((studentId: string, assignmentId: string, value: string) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) && value !== '') return;

    // Update local state immediately for responsive UI
    if (gradebookData) {
      const updatedData = { ...gradebookData };
      const studentRow = updatedData.students.find(s => s.student.id === studentId);
      if (studentRow) {
        const points = value === '' ? null : numericValue;
        studentRow.grades[assignmentId] = {
          ...studentRow.grades[assignmentId],
          studentId,
          courseSectionId,
          assignmentId,
          points: points || undefined,
          gradeType: 'Assignment'
        } as Grade;
        setGradebookData(updatedData);
      }
    }

    // Queue update for auto-save
    pendingGradeUpdates.current.set(
      `${studentId}-${assignmentId}`,
      {
        studentId,
        courseSectionId,
        assignmentId,
        points: value === '' ? null : numericValue
      }
    );

    // Clear existing timeout and set new one
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveTimeout.current = setTimeout(() => {
      autoSaveGrades();
    }, 1500); // Auto-save after 1.5 seconds of inactivity
  }, [courseSectionId, gradebookData, autoSaveGrades]);

  // Create assignment
  const handleCreateAssignment = async () => {
    try {
      const assignment = await gradebookService.createAssignment({
        ...newAssignment,
        courseSectionId,
        dueDate: newAssignment.dueDate.toISOString()
      });
      setAssignments([...assignments, assignment]);
      setAssignmentDialogOpen(false);
      setNewAssignment({
        title: '',
        description: '',
        type: 'Homework',
        dueDate: new Date(),
        maxPoints: 100,
        weight: 1.0,
        category: 'Homework'
      });
      await loadGradebook();
      setSuccess('Assignment created successfully');
    } catch (err) {
      setError('Failed to create assignment');
      console.error(err);
    }
  };

  // Update assignment
  const handleUpdateAssignment = async () => {
    if (!selectedAssignment) return;
    
    try {
      await gradebookService.updateAssignment(selectedAssignment.id, {
        ...newAssignment,
        dueDate: newAssignment.dueDate.toISOString()
      });
      setAssignmentDialogOpen(false);
      setSelectedAssignment(null);
      await loadGradebook();
      setSuccess('Assignment updated successfully');
    } catch (err) {
      setError('Failed to update assignment');
      console.error(err);
    }
  };

  // Delete assignment
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? All associated grades will be deleted.')) {
      return;
    }
    
    try {
      await gradebookService.deleteAssignment(assignmentId);
      await loadGradebook();
      setSuccess('Assignment deleted successfully');
    } catch (err) {
      setError('Failed to delete assignment');
      console.error(err);
    }
  };

  // Prepare columns for DataGrid
  const columns: GridColDef[] = [
    {
      field: 'studentName',
      headerName: 'Student',
      width: 200,
      frozen: true,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2">
            {params.row.lastName}, {params.row.firstName}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            ID: {params.row.studentId}
          </Typography>
        </Box>
      )
    },
    ...assignments.map((assignment): GridColDef => ({
      field: assignment.id,
      headerName: assignment.title,
      width: 120,
      editable: true,
      renderHeader: () => (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" noWrap>
            {assignment.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <Chip 
              label={assignment.type} 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.65rem', height: 18 }}
            />
            <Typography variant="caption" color="textSecondary">
              {assignment.maxPoints}pts
            </Typography>
          </Box>
        </Box>
      ),
      renderCell: (params: GridRenderCellParams) => {
        const grade = params.row.grades[assignment.id];
        const points = grade?.points;
        const percentage = points !== undefined && points !== null 
          ? (points / assignment.maxPoints) * 100 
          : null;
        
        return (
          <TextField
            value={points ?? ''}
            onChange={(e) => handleGradeChange(params.row.id, assignment.id, e.target.value)}
            size="small"
            variant="standard"
            inputProps={{
              style: { textAlign: 'center' },
              min: 0,
              max: assignment.maxPoints
            }}
            fullWidth
            placeholder="-"
            helperText={percentage !== null ? `${percentage.toFixed(0)}%` : ''}
          />
        );
      }
    })),
    {
      field: 'average',
      headerName: 'Average',
      width: 100,
      renderCell: (params: GridRenderCellParams) => {
        const grades = params.row.grades;
        let totalPoints = 0;
        let totalPossible = 0;
        
        assignments.forEach(assignment => {
          const grade = grades[assignment.id];
          if (grade?.points !== undefined && grade?.points !== null) {
            totalPoints += grade.points;
            totalPossible += assignment.maxPoints;
          }
        });
        
        const average = totalPossible > 0 ? (totalPoints / totalPossible) * 100 : null;
        const letterGrade = average !== null ? getLetterGrade(average) : '-';
        
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              {average !== null ? `${average.toFixed(1)}%` : '-'}
            </Typography>
            <Chip 
              label={letterGrade} 
              size="small" 
              color={getGradeColor(letterGrade)}
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          </Box>
        );
      }
    }
  ];

  // Prepare rows for DataGrid
  const rows = gradebookData?.students.map(student => ({
    id: student.student.id,
    studentId: student.student.studentUniqueId,
    firstName: student.student.firstName,
    lastName: student.student.lastName,
    grades: student.grades,
    ...student.student
  })) || [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">Gradebook</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {saving && (
                <Chip 
                  icon={<SaveIcon />} 
                  label="Saving..." 
                  color="primary" 
                  variant="outlined"
                />
              )}
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedAssignment(null);
                  setNewAssignment({
                    title: '',
                    description: '',
                    type: 'Homework',
                    dueDate: new Date(),
                    maxPoints: 100,
                    weight: 1.0,
                    category: 'Homework'
                  });
                  setAssignmentDialogOpen(true);
                }}
              >
                Add Assignment
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25, page: 0 },
                },
              }}
              pageSizeOptions={[25, 50, 100]}
              sx={{
                '& .MuiDataGrid-cell': {
                  borderRight: '1px solid rgba(224, 224, 224, 1)',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog 
        open={assignmentDialogOpen} 
        onClose={() => setAssignmentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedAssignment ? 'Edit Assignment' : 'New Assignment'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Title"
              value={newAssignment.title}
              onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={newAssignment.description}
              onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={newAssignment.type}
                onChange={(e) => setNewAssignment({ ...newAssignment, type: e.target.value as any })}
                label="Type"
              >
                <MenuItem value="Homework">Homework</MenuItem>
                <MenuItem value="Quiz">Quiz</MenuItem>
                <MenuItem value="Test">Test</MenuItem>
                <MenuItem value="Project">Project</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={newAssignment.category}
                onChange={(e) => setNewAssignment({ ...newAssignment, category: e.target.value })}
                label="Category"
              >
                <MenuItem value="Homework">Homework</MenuItem>
                <MenuItem value="Quizzes">Quizzes</MenuItem>
                <MenuItem value="Tests">Tests</MenuItem>
                <MenuItem value="Projects">Projects</MenuItem>
                <MenuItem value="Participation">Participation</MenuItem>
              </Select>
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date"
                value={newAssignment.dueDate}
                onChange={(date) => date && setNewAssignment({ ...newAssignment, dueDate: date })}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </LocalizationProvider>
            <TextField
              label="Max Points"
              type="number"
              value={newAssignment.maxPoints}
              onChange={(e) => setNewAssignment({ ...newAssignment, maxPoints: parseFloat(e.target.value) })}
              fullWidth
              required
            />
            <TextField
              label="Weight"
              type="number"
              value={newAssignment.weight}
              onChange={(e) => setNewAssignment({ ...newAssignment, weight: parseFloat(e.target.value) })}
              fullWidth
              helperText="Weight for calculating weighted average"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={selectedAssignment ? handleUpdateAssignment : handleCreateAssignment}
            variant="contained"
          >
            {selectedAssignment ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Helper functions
function getLetterGrade(percentage: number): string {
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}

function getGradeColor(letterGrade: string): 'success' | 'warning' | 'error' | 'default' {
  if (letterGrade.startsWith('A')) return 'success';
  if (letterGrade.startsWith('B')) return 'success';
  if (letterGrade.startsWith('C')) return 'warning';
  if (letterGrade.startsWith('D')) return 'warning';
  if (letterGrade === 'F') return 'error';
  return 'default';
}

export default TeacherGradebook;