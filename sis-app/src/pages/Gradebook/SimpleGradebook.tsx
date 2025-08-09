import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import gradebookService from '../../services/gradebookService';

interface SimpleGradebookProps {
  courseSectionId: string;
}

const SimpleGradebook: React.FC<SimpleGradebookProps> = ({ courseSectionId }) => {
  const [gradebookData, setGradebookData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    loadGradebook();
  }, [courseSectionId]);

  const loadGradebook = async () => {
    try {
      setLoading(true);
      const data = await gradebookService.getGradebook(courseSectionId);
      setGradebookData(data);
      console.log('Gradebook data loaded:', data);
    } catch (error) {
      console.error('Error loading gradebook:', error);
      setMessage({ type: 'error', text: 'Failed to load gradebook' });
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (studentId: string, assignmentId: string, value: string) => {
    const key = `${studentId}::${assignmentId}`;
    const numValue = parseFloat(value);
    
    if (value === '') {
      pendingChanges.delete(key);
    } else if (!isNaN(numValue)) {
      pendingChanges.set(key, numValue);
    }
    
    setPendingChanges(new Map(pendingChanges));
    
    // Update local state for immediate feedback
    if (gradebookData) {
      const updatedData = { ...gradebookData };
      const student = updatedData.students.find((s: any) => s.student.id === studentId);
      if (student) {
        if (!student.grades[assignmentId]) {
          student.grades[assignmentId] = {};
        }
        student.grades[assignmentId].points = value === '' ? null : numValue;
      }
      setGradebookData(updatedData);
    }
  };

  const saveGrades = async () => {
    if (pendingChanges.size === 0) {
      setMessage({ type: 'error', text: 'No changes to save' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const promises = Array.from(pendingChanges.entries()).map(([key, points]) => {
        const [studentId, assignmentId] = key.split('::');
        console.log('Saving grade:', { studentId, assignmentId, points });
        
        return gradebookService.upsertGrade({
          studentId,
          courseSectionId,
          assignmentId,
          points
        });
      });

      await Promise.all(promises);
      setPendingChanges(new Map());
      setMessage({ type: 'success', text: `Saved ${promises.length} grade(s) successfully` });
      
      // Reload to get fresh data
      await loadGradebook();
    } catch (error: any) {
      console.error('Error saving grades:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to save grades';
      const errorDetails = error.response?.data?.details ? JSON.stringify(error.response.data.details) : '';
      setMessage({ type: 'error', text: `${errorMessage} ${errorDetails}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!gradebookData) {
    return <Alert severity="error">No gradebook data available</Alert>;
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Simple Gradebook</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {pendingChanges.size > 0 && (
              <Chip label={`${pendingChanges.size} unsaved changes`} color="warning" />
            )}
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={saveGrades}
              disabled={saving || pendingChanges.size === 0}
            >
              Save Grades
            </Button>
          </Box>
        </Box>
        
        {message && (
          <Alert severity={message.type} sx={{ mt: 2 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Student Name</TableCell>
              <TableCell>Student ID</TableCell>
              {gradebookData.assignments.map((assignment: any) => (
                <TableCell key={assignment.id} align="center">
                  <Box>
                    <Typography variant="caption" display="block">
                      {assignment.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Max: {assignment.maxPoints}
                    </Typography>
                  </Box>
                </TableCell>
              ))}
              <TableCell align="center">Average</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {gradebookData.students.map((studentData: any) => {
              const student = studentData.student;
              const grades = studentData.grades;
              
              // Calculate average
              let totalPoints = 0;
              let totalPossible = 0;
              gradebookData.assignments.forEach((assignment: any) => {
                const grade = grades[assignment.id];
                if (grade?.points !== undefined && grade?.points !== null) {
                  totalPoints += grade.points;
                  totalPossible += assignment.maxPoints;
                }
              });
              const average = totalPossible > 0 ? (totalPoints / totalPossible) * 100 : null;
              
              return (
                <TableRow key={student.id}>
                  <TableCell>
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell>{student.studentUniqueId}</TableCell>
                  {gradebookData.assignments.map((assignment: any) => {
                    const grade = grades[assignment.id];
                    const points = grade?.points;
                    const key = `${student.id}::${assignment.id}`;
                    const hasChange = pendingChanges.has(key);
                    
                    return (
                      <TableCell key={assignment.id} align="center">
                        <TextField
                          value={points ?? ''}
                          onChange={(e) => handleGradeChange(student.id, assignment.id, e.target.value)}
                          size="small"
                          variant="outlined"
                          inputProps={{
                            style: { 
                              textAlign: 'center',
                              width: '60px',
                              backgroundColor: hasChange ? '#fff3cd' : 'transparent'
                            },
                            min: 0,
                            max: assignment.maxPoints,
                            step: 0.5
                          }}
                          type="number"
                          placeholder="-"
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell align="center">
                    {average !== null ? (
                      <Box>
                        <Typography variant="body2">
                          {average.toFixed(1)}%
                        </Typography>
                        <Chip 
                          label={getLetterGrade(average)} 
                          size="small"
                          color={average >= 70 ? 'success' : 'error'}
                        />
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

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

export default SimpleGradebook;