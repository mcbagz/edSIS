import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Divider
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import gradebookService from '../../services/gradebookService';
import type { ReportCard as ReportCardType } from '../../services/gradebookService';

interface ReportCardProps {
  studentId: string;
  gradingPeriods: Array<{ id: string; name: string; beginDate: string; endDate: string }>;
}

const ReportCard: React.FC<ReportCardProps> = ({ studentId, gradingPeriods }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [reportCard, setReportCard] = useState<ReportCardType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gradingPeriods.length > 0 && !selectedPeriodId) {
      setSelectedPeriodId(gradingPeriods[0].id);
    }
  }, [gradingPeriods]);

  useEffect(() => {
    if (selectedPeriodId) {
      loadReportCard();
    }
  }, [selectedPeriodId, studentId]);

  const loadReportCard = async () => {
    try {
      setLoading(true);
      const data = await gradebookService.getReportCard(studentId, selectedPeriodId);
      setReportCard(data);
      setError(null);
    } catch (err) {
      setError('Failed to load report card');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!reportCard) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.text('Student Report Card', pageWidth / 2, 20, { align: 'center' });
    
    // School info (placeholder - would come from school data)
    doc.setFontSize(12);
    doc.text('Lincoln High School', pageWidth / 2, 30, { align: 'center' });
    doc.text('123 Education Blvd, Learning City, ST 12345', pageWidth / 2, 36, { align: 'center' });
    
    // Student info
    doc.setFontSize(10);
    doc.text(`Student: ${reportCard.student.firstName} ${reportCard.student.lastName}`, 14, 50);
    doc.text(`Student ID: ${reportCard.student.studentUniqueId}`, 14, 56);
    doc.text(`Grade Level: ${reportCard.student.gradeLevel}`, 14, 62);
    
    // Grading period info
    doc.text(`Grading Period: ${reportCard.gradingPeriod.name}`, pageWidth - 14, 50, { align: 'right' });
    doc.text(
      `Period: ${format(new Date(reportCard.gradingPeriod.beginDate), 'MM/dd/yyyy')} - ${format(new Date(reportCard.gradingPeriod.endDate), 'MM/dd/yyyy')}`,
      pageWidth - 14,
      56,
      { align: 'right' }
    );
    doc.text(`Generated: ${format(new Date(reportCard.generatedAt), 'MM/dd/yyyy')}`, pageWidth - 14, 62, { align: 'right' });
    
    // Add a line separator
    doc.line(14, 68, pageWidth - 14, 68);
    
    // Grades table
    const tableData = reportCard.courses.map(course => [
      course.course?.name || 'N/A',
      `${course.teacher?.firstName || ''} ${course.teacher?.lastName || ''}`.trim() || 'N/A',
      course.course?.credits || 'N/A',
      course.numericGrade.toFixed(1) + '%',
      course.letterGrade
    ]);
    
    autoTable(doc, {
      head: [['Course', 'Teacher', 'Credits', 'Percentage', 'Grade']],
      body: tableData,
      startY: 75,
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 50 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' }
      }
    });
    
    // Calculate summary statistics
    const totalCredits = reportCard.courses.reduce((sum, course) => 
      sum + (course.course?.credits || 0), 0
    );
    const weightedGradeSum = reportCard.courses.reduce((sum, course) => 
      sum + (course.numericGrade * (course.course?.credits || 0)), 0
    );
    const overallAverage = totalCredits > 0 ? weightedGradeSum / totalCredits : 0;
    
    // Add summary section
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Summary', 14, finalY);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Total Credits: ${totalCredits}`, 14, finalY + 8);
    doc.text(`Overall Average: ${overallAverage.toFixed(1)}%`, 14, finalY + 14);
    doc.text(`Overall Grade: ${getLetterGrade(overallAverage)}`, 14, finalY + 20);
    
    // Grading scale
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Grading Scale', pageWidth - 60, finalY);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    const gradeScale = [
      'A: 93-100%',
      'A-: 90-92%',
      'B+: 87-89%',
      'B: 83-86%',
      'B-: 80-82%',
      'C+: 77-79%',
      'C: 73-76%',
      'C-: 70-72%',
      'D+: 67-69%',
      'D: 63-66%',
      'D-: 60-62%',
      'F: Below 60%'
    ];
    gradeScale.forEach((grade, index) => {
      doc.text(grade, pageWidth - 60, finalY + 8 + (index * 5));
    });
    
    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.text('This is an official report card. For questions, contact the school registrar.', pageWidth / 2, footerY, { align: 'center' });
    
    // Save the PDF
    doc.save(`ReportCard_${reportCard.student.lastName}_${reportCard.student.firstName}_${reportCard.gradingPeriod.name.replace(/\s+/g, '_')}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

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
            <Typography variant="h5">Report Card</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Grading Period</InputLabel>
                <Select
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  label="Grading Period"
                >
                  {gradingPeriods.map(period => (
                    <MenuItem key={period.id} value={period.id}>
                      {period.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                disabled={!reportCard}
              >
                Print
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={generatePDF}
                disabled={!reportCard}
              >
                Download PDF
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {reportCard && (
            <Box className="printable-report-card">
              {/* Header Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" align="center" sx={{ mb: 1 }}>
                  Lincoln High School
                </Typography>
                <Typography variant="body2" align="center" color="textSecondary">
                  123 Education Blvd, Learning City, ST 12345
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Student Information */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Student Name
                  </Typography>
                  <Typography variant="body1">
                    {reportCard.student.firstName} {reportCard.student.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Student ID
                  </Typography>
                  <Typography variant="body1">
                    {reportCard.student.studentUniqueId}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Grade Level
                  </Typography>
                  <Typography variant="body1">
                    {reportCard.student.gradeLevel}
                  </Typography>
                </Grid>
              </Grid>

              {/* Grading Period Information */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Grading Period
                  </Typography>
                  <Typography variant="body1">
                    {reportCard.gradingPeriod.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Period Dates
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(reportCard.gradingPeriod.beginDate), 'MM/dd/yyyy')} - {' '}
                    {format(new Date(reportCard.gradingPeriod.endDate), 'MM/dd/yyyy')}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 3 }} />

              {/* Grades Table */}
              <Typography variant="h6" sx={{ mb: 2 }}>
                Academic Performance
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell>Course</TableCell>
                      <TableCell>Teacher</TableCell>
                      <TableCell align="center">Credits</TableCell>
                      <TableCell align="center">Percentage</TableCell>
                      <TableCell align="center">Grade</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportCard.courses.map((course, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2">
                            {course.course?.name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {course.teacher?.firstName} {course.teacher?.lastName}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {course.course?.credits || 'N/A'}
                        </TableCell>
                        <TableCell align="center">
                          {course.numericGrade.toFixed(1)}%
                        </TableCell>
                        <TableCell align="center">
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: getGradeColorValue(course.letterGrade)
                            }}
                          >
                            {course.letterGrade}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Summary Section */}
              <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Grid container spacing={3}>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Total Credits
                    </Typography>
                    <Typography variant="h6">
                      {reportCard.courses.reduce((sum, c) => sum + (c.course?.credits || 0), 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Overall Average
                    </Typography>
                    <Typography variant="h6">
                      {(() => {
                        const totalCredits = reportCard.courses.reduce((sum, c) => sum + (c.course?.credits || 0), 0);
                        const weightedSum = reportCard.courses.reduce((sum, c) => 
                          sum + (c.numericGrade * (c.course?.credits || 0)), 0
                        );
                        return totalCredits > 0 ? (weightedSum / totalCredits).toFixed(1) : '0.0';
                      })()}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Overall Grade
                    </Typography>
                    <Typography variant="h6">
                      {(() => {
                        const totalCredits = reportCard.courses.reduce((sum, c) => sum + (c.course?.credits || 0), 0);
                        const weightedSum = reportCard.courses.reduce((sum, c) => 
                          sum + (c.numericGrade * (c.course?.credits || 0)), 0
                        );
                        const average = totalCredits > 0 ? weightedSum / totalCredits : 0;
                        return getLetterGrade(average);
                      })()}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Footer */}
              <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="textSecondary" align="center" display="block">
                  Generated on {format(new Date(reportCard.generatedAt), 'MMMM dd, yyyy')}
                </Typography>
                <Typography variant="caption" color="textSecondary" align="center" display="block">
                  This is an official report card. For questions, contact the school registrar.
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-report-card, .printable-report-card * {
            visibility: visible;
          }
          .printable-report-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
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

function getGradeColorValue(letterGrade: string): string {
  if (letterGrade.startsWith('A')) return '#4caf50';
  if (letterGrade.startsWith('B')) return '#8bc34a';
  if (letterGrade.startsWith('C')) return '#ff9800';
  if (letterGrade.startsWith('D')) return '#ff5722';
  if (letterGrade === 'F') return '#f44336';
  return '#757575';
}

export default ReportCard;