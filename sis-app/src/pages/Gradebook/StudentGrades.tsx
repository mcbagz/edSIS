import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { format } from 'date-fns';
import gradebookService from '../../services/gradebookService';
import type { Grade, WeightedGrade, GPA } from '../../services/gradebookService';

interface StudentGradesProps {
  studentId: string;
}

const StudentGrades: React.FC<StudentGradesProps> = ({ studentId }) => {
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [gpa, setGpa] = useState<GPA | null>(null);
  const [weightedGrades, setWeightedGrades] = useState<Map<string, WeightedGrade>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      
      // Load grades
      const studentGrades = await gradebookService.getStudentGrades(studentId);
      setGrades(studentGrades);

      // Load GPA
      const gpaData = await gradebookService.calculateGPA(studentId);
      setGpa(gpaData);

      // Get unique course sections
      const courseSectionIds = [...new Set(studentGrades.map(g => g.courseSectionId))];
      
      // Load weighted grades for each course section
      const weightedGradesMap = new Map<string, WeightedGrade>();
      for (const courseSectionId of courseSectionIds) {
        try {
          const weighted = await gradebookService.calculateWeightedGrade(studentId, courseSectionId);
          weightedGradesMap.set(courseSectionId, weighted);
        } catch (err) {
          console.error(`Failed to load weighted grade for section ${courseSectionId}`, err);
        }
      }
      setWeightedGrades(weightedGradesMap);
      
      setError(null);
    } catch (err) {
      setError('Failed to load student grades');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Group grades by course section
  const gradesByCourse = grades.reduce((acc, grade) => {
    const courseId = grade.courseSectionId;
    if (!acc[courseId]) {
      acc[courseId] = [];
    }
    acc[courseId].push(grade);
    return acc;
  }, {} as Record<string, Grade[]>);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* GPA Card */}
      {gpa && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <SchoolIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h3" color="primary">
                    {gpa.gpa.toFixed(2)}
                  </Typography>
                  <Typography variant="subtitle1" color="textSecondary">
                    Current GPA
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={9}>
                <Box sx={{ pt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Total Credits Earned
                      </Typography>
                      <Typography variant="h6">
                        {gpa.totalCredits}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Quality Points
                      </Typography>
                      <Typography variant="h6">
                        {gpa.totalQualityPoints.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        GPA Scale
                      </Typography>
                      <Typography variant="h6">
                        {gpa.scale}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Courses and Grades */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Course Grades
      </Typography>

      {Object.entries(gradesByCourse).map(([courseSectionId, courseGrades]) => {
        const weightedGrade = weightedGrades.get(courseSectionId);
        const courseInfo = courseGrades[0]?.courseSection;
        
        return (
          <Accordion key={courseSectionId} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                <AssignmentIcon color="action" />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">
                    {courseInfo?.course?.name || 'Course'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {courseInfo?.teacher?.firstName} {courseInfo?.teacher?.lastName}
                  </Typography>
                </Box>
                {weightedGrade && (
                  <Box sx={{ textAlign: 'right', mr: 2 }}>
                    <Typography variant="h5">
                      {weightedGrade.numericGrade.toFixed(1)}%
                    </Typography>
                    <Chip 
                      label={weightedGrade.letterGrade} 
                      color={getGradeColor(weightedGrade.letterGrade)}
                      size="small"
                    />
                  </Box>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {/* Grade breakdown by category */}
              {weightedGrade && weightedGrade.gradesByCategory && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Grade Breakdown by Category
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(weightedGrade.gradesByCategory).map(([category, data]) => {
                      const percentage = data.possible > 0 
                        ? (data.earned / data.possible) * 100 
                        : 0;
                      return (
                        <Grid item xs={12} md={6} key={category}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle2" color="textSecondary">
                                {category} (Weight: {data.weight})
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Box sx={{ width: '100%', mr: 1 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={percentage}
                                    sx={{ height: 8, borderRadius: 4 }}
                                  />
                                </Box>
                                <Box sx={{ minWidth: 60 }}>
                                  <Typography variant="body2" color="textSecondary">
                                    {percentage.toFixed(1)}%
                                  </Typography>
                                </Box>
                              </Box>
                              <Typography variant="caption" color="textSecondary">
                                {data.earned} / {data.possible} points
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}

              {/* Assignment grades table */}
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Assignment Grades
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Assignment</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell align="right">Score</TableCell>
                      <TableCell align="right">Max Points</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                      <TableCell>Grade</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {courseGrades
                      .filter(grade => grade.assignment)
                      .sort((a, b) => {
                        const dateA = new Date(a.assignment?.dueDate || 0);
                        const dateB = new Date(b.assignment?.dueDate || 0);
                        return dateB.getTime() - dateA.getTime();
                      })
                      .map((grade) => {
                        const percentage = grade.points && grade.assignment?.maxPoints 
                          ? (grade.points / grade.assignment.maxPoints) * 100 
                          : null;
                        const letterGrade = percentage !== null ? getLetterGrade(percentage) : '-';
                        
                        return (
                          <TableRow key={grade.id}>
                            <TableCell>{grade.assignment?.title}</TableCell>
                            <TableCell>
                              <Chip 
                                label={grade.assignment?.type} 
                                size="small" 
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              {grade.assignment?.dueDate 
                                ? format(new Date(grade.assignment.dueDate), 'MM/dd/yyyy')
                                : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {grade.points ?? '-'}
                            </TableCell>
                            <TableCell align="right">
                              {grade.assignment?.maxPoints}
                            </TableCell>
                            <TableCell align="right">
                              {percentage !== null ? `${percentage.toFixed(1)}%` : '-'}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={letterGrade} 
                                size="small"
                                color={getGradeColor(letterGrade)}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        );
      })}
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

export default StudentGrades;