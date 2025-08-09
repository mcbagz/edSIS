import React, { useState, useRef } from 'react';
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
  Divider,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Print,
  Download,
  School,
  Grade,
  CalendarToday,
  TrendingUp,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../services/api';
import { Button } from '../../components';

interface TranscriptProps {
  studentId: string;
}

interface CourseGrade {
  courseCode: string;
  courseName: string;
  credits: number;
  letterGrade: string;
  gradePoints: number;
  term: string;
  year: string;
  teacherName: string;
}

interface TranscriptData {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
    gradeLevel: string;
    dateOfBirth: string;
    enrollmentDate: string;
  };
  school: {
    name: string;
    address: string;
    phone: string;
    principal: string;
  };
  academicHistory: {
    year: string;
    term: string;
    gradeLevel: string;
    courses: CourseGrade[];
    termGPA: number;
    termCredits: number;
  }[];
  cumulativeGPA: number;
  totalCredits: number;
  classRank?: number;
  classSize?: number;
  graduationDate?: string;
}

const gradeColors: Record<string, any> = {
  'A+': 'success',
  'A': 'success',
  'A-': 'success',
  'B+': 'info',
  'B': 'info',
  'B-': 'info',
  'C+': 'warning',
  'C': 'warning',
  'C-': 'warning',
  'D+': 'error',
  'D': 'error',
  'D-': 'error',
  'F': 'error',
};

export const Transcript: React.FC<TranscriptProps> = ({ studentId }) => {
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Fetch transcript data
  const { data: transcript, isLoading, error } = useQuery({
    queryKey: ['transcript', studentId],
    queryFn: async () => {
      const response = await api.get(`/students/${studentId}/transcript`);
      return response.data as TranscriptData;
    },
    enabled: !!studentId,
  });

  const handlePrint = useReactToPrint({
    content: () => transcriptRef.current,
    documentTitle: `Transcript_${transcript?.student.firstName}_${transcript?.student.lastName}`,
  });

  const handleDownloadPDF = async () => {
    if (!transcriptRef.current) return;
    
    setDownloading(true);
    try {
      const canvas = await html2canvas(transcriptRef.current, {
        scale: 2,
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Transcript_${transcript?.student.firstName}_${transcript?.student.lastName}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !transcript) {
    return (
      <Alert severity="error">
        Unable to load transcript. Please try again later.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
        <Button
          variant="outlined"
          icon={<Print />}
          iconPosition="start"
          onClick={handlePrint}
        >
          Print
        </Button>
        <Button
          variant="contained"
          icon={<Download />}
          iconPosition="start"
          onClick={handleDownloadPDF}
          disabled={downloading}
        >
          {downloading ? 'Generating...' : 'Download PDF'}
        </Button>
      </Box>

      <Paper sx={{ p: 4 }} ref={transcriptRef}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <School sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" gutterBottom>
            {transcript.school.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {transcript.school.address}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Phone: {transcript.school.phone}
          </Typography>
          <Typography variant="h5" sx={{ mt: 3, fontWeight: 'bold' }}>
            OFFICIAL TRANSCRIPT
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Student Information */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Student Information
            </Typography>
            <Typography variant="h6">
              {transcript.student.firstName} {transcript.student.lastName}
            </Typography>
            <Typography variant="body2">
              Student ID: {transcript.student.studentId}
            </Typography>
            <Typography variant="body2">
              Date of Birth: {new Date(transcript.student.dateOfBirth).toLocaleDateString()}
            </Typography>
            <Typography variant="body2">
              Current Grade: {transcript.student.gradeLevel}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Academic Summary
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <TrendingUp color="primary" />
              <Typography variant="h6">
                Cumulative GPA: {transcript.cumulativeGPA.toFixed(2)}
              </Typography>
            </Box>
            <Typography variant="body2">
              Total Credits: {transcript.totalCredits}
            </Typography>
            {transcript.classRank && (
              <Typography variant="body2">
                Class Rank: {transcript.classRank} of {transcript.classSize}
              </Typography>
            )}
            {transcript.graduationDate && (
              <Typography variant="body2">
                Expected Graduation: {new Date(transcript.graduationDate).toLocaleDateString()}
              </Typography>
            )}
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* Academic History */}
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarToday color="action" />
          Academic History
        </Typography>

        {transcript.academicHistory.map((termData) => (
          <Box key={`${termData.year}-${termData.term}`} sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {termData.term} {termData.year} - Grade {termData.gradeLevel}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip
                  label={`Term GPA: ${termData.termGPA.toFixed(2)}`}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={`Credits: ${termData.termCredits}`}
                  color="secondary"
                  size="small"
                />
              </Box>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell>Course Code</TableCell>
                    <TableCell>Course Name</TableCell>
                    <TableCell>Teacher</TableCell>
                    <TableCell align="center">Credits</TableCell>
                    <TableCell align="center">Grade</TableCell>
                    <TableCell align="center">Grade Points</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {termData.courses.map((course, index) => (
                    <TableRow key={index}>
                      <TableCell>{course.courseCode}</TableCell>
                      <TableCell>{course.courseName}</TableCell>
                      <TableCell>{course.teacherName}</TableCell>
                      <TableCell align="center">{course.credits}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={course.letterGrade}
                          size="small"
                          color={gradeColors[course.letterGrade] || 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">{course.gradePoints.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}

        <Divider sx={{ my: 3 }} />

        {/* Footer */}
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1, mb: 1 }}>
                <Typography variant="caption">Registrar Signature</Typography>
              </Box>
              <Typography variant="body2">
                Date: {new Date().toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1, mb: 1 }}>
                <Typography variant="caption">School Official</Typography>
              </Box>
              <Typography variant="body2">
                {transcript.school.principal}, Principal
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Grading Scale */}
        <Box sx={{ mt: 4, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Grading Scale
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption">A+ = 97-100 (4.0)</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption">A = 93-96 (4.0)</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption">A- = 90-92 (3.7)</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption">B+ = 87-89 (3.3)</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption">B = 83-86 (3.0)</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption">B- = 80-82 (2.7)</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption">C+ = 77-79 (2.3)</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption">C = 73-76 (2.0)</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption">C- = 70-72 (1.7)</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption">D+ = 67-69 (1.3)</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption">D = 65-66 (1.0)</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption">F = Below 65 (0.0)</Typography>
            </Grid>
          </Grid>
        </Box>

        <Typography variant="caption" display="block" sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
          This transcript is the official academic record of the above-named student.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Transcript;