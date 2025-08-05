import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Chip,
  Stack,
  Alert
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { useToast } from '../../components/molecules/Toast';
import { getStudentSchedule } from '../../services/schedulingService';
import { useAuth } from '../../contexts/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const daysOrder = ['M', 'T', 'W', 'Th', 'F'];
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

export const StudentSchedule: React.FC = () => {
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const studentId = user?.studentId || localStorage.getItem('studentId') || '1';
      const sessionId = localStorage.getItem('currentSessionId');
      
      const data = await getStudentSchedule(studentId, sessionId);
      setSchedule(data);
    } catch (error) {
      showToast('Failed to fetch schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!schedule) return;

    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.text('Student Schedule', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Student ID: ${schedule.studentId}`, 14, 32);
    doc.text(`Session: ${schedule.sections[0]?.sessionName || 'Current'}`, 14, 38);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 44);
    
    // Add schedule table
    const tableData = schedule.sections.map((section: any) => [
      `${section.courseCode}`,
      section.courseName,
      section.sectionIdentifier,
      section.teacherName,
      section.roomNumber || '-',
      section.period || section.time || '-',
      section.days.join(', '),
      section.credits
    ]);
    
    doc.autoTable({
      head: [['Code', 'Course', 'Section', 'Teacher', 'Room', 'Time', 'Days', 'Credits']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [33, 150, 243] }
    });
    
    // Add total credits
    const totalCredits = schedule.sections.reduce((sum: number, s: any) => sum + s.credits, 0);
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.text(`Total Credits: ${totalCredits}`, 14, finalY + 10);
    
    // Save the PDF
    doc.save(`schedule_${schedule.studentId}_${new Date().getTime()}.pdf`);
    showToast('Schedule downloaded as PDF', 'success');
  };

  const createScheduleGrid = () => {
    if (!schedule || !schedule.sections) return [];
    
    const grid: any = {};
    timeSlots.forEach(time => {
      grid[time] = {};
      daysOrder.forEach(day => {
        grid[time][day] = null;
      });
    });
    
    schedule.sections.forEach((section: any) => {
      if (section.time && section.days) {
        section.days.forEach((day: string) => {
          if (grid[section.time] && grid[section.time][day] !== undefined) {
            grid[section.time][day] = section;
          }
        });
      }
    });
    
    return grid;
  };

  const scheduleGrid = createScheduleGrid();
  const totalCredits = schedule?.sections?.reduce((sum: number, s: any) => sum + s.credits, 0) || 0;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading schedule...</Typography>
      </Box>
    );
  }

  if (!schedule || !schedule.sections || schedule.sections.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No schedule found for the current session. Please contact your advisor to register for courses.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon />
          My Schedule
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant={view === 'list' ? 'contained' : 'outlined'}
            onClick={() => setView('list')}
            startIcon={<ScheduleIcon />}
          >
            List View
          </Button>
          <Button
            variant={view === 'grid' ? 'contained' : 'outlined'}
            onClick={() => setView('grid')}
            startIcon={<CalendarIcon />}
          >
            Grid View
          </Button>
          <Button
            variant="outlined"
            onClick={generatePDF}
            startIcon={<DownloadIcon />}
          >
            Download PDF
          </Button>
        </Stack>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="text.secondary">Session</Typography>
              <Typography variant="h6">{schedule.sections[0]?.sessionName || 'Current'}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="text.secondary">Total Courses</Typography>
              <Typography variant="h6">{schedule.sections.length}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="text.secondary">Total Credits</Typography>
              <Typography variant="h6">{totalCredits}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="text.secondary">Status</Typography>
              <Chip label="Active" color="success" />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {view === 'list' ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Course Code</TableCell>
                <TableCell>Course Name</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>Teacher</TableCell>
                <TableCell>Room</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Days</TableCell>
                <TableCell>Credits</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedule.sections.map((section: any) => (
                <TableRow key={section.id}>
                  <TableCell>{section.courseCode}</TableCell>
                  <TableCell>{section.courseName}</TableCell>
                  <TableCell>{section.sectionIdentifier}</TableCell>
                  <TableCell>{section.teacherName}</TableCell>
                  <TableCell>{section.roomNumber || '-'}</TableCell>
                  <TableCell>{section.period || section.time || '-'}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {section.days.map((day: string) => (
                        <Chip key={day} label={day} size="small" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>{section.credits}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={7} align="right">
                  <strong>Total Credits:</strong>
                </TableCell>
                <TableCell>
                  <strong>{totalCredits}</strong>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                {daysOrder.map(day => (
                  <TableCell key={day} align="center">{day}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {timeSlots.map(time => {
                const hasClasses = daysOrder.some(day => scheduleGrid[time]?.[day]);
                if (!hasClasses) return null;
                
                return (
                  <TableRow key={time}>
                    <TableCell>{time}</TableCell>
                    {daysOrder.map(day => {
                      const section = scheduleGrid[time]?.[day];
                      return (
                        <TableCell key={day} align="center">
                          {section ? (
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {section.courseCode}
                              </Typography>
                              <Typography variant="caption" display="block">
                                {section.roomNumber}
                              </Typography>
                            </Box>
                          ) : '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};