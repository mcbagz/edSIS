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
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SaveIcon from '@mui/icons-material/Save';
import attendanceService from '../../services/attendanceService';
import schedulingService from '../../services/schedulingService';
import type { AttendanceCode, PeriodAttendance as PeriodAttendanceType } from '../../services/attendanceService';
import type { Section } from '../../services/schedulingService';

interface AttendanceEntry {
  studentId: string;
  studentName: string;
  attendanceCode: string;
  codeId: string;
  comments: string;
}

const PeriodAttendance: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [sections, setSections] = useState<Section[]>([]);
  const [attendanceCodes, setAttendanceCodes] = useState<AttendanceCode[]>([]);
  const [attendanceData, setAttendanceData] = useState<Map<string, AttendanceEntry>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Fetch attendance codes and sections on mount
  useEffect(() => {
    loadAttendanceCodes();
    loadSections();
  }, []);

  // Load attendance when section or date changes
  useEffect(() => {
    if (selectedSection && selectedDate) {
      loadSectionAttendance();
    }
  }, [selectedSection, selectedDate, selectedPeriod]);

  const loadAttendanceCodes = async () => {
    try {
      const codes = await attendanceService.getAttendanceCodes();
      setAttendanceCodes(codes);
    } catch (error) {
      console.error('Error loading attendance codes:', error);
      setMessage({ type: 'error', text: 'Failed to load attendance codes' });
    }
  };

  const loadSections = async () => {
    try {
      // In a real implementation, this would load teacher's sections
      const sectionList = await schedulingService.getSections();
      setSections(sectionList);
      if (sectionList.length > 0) {
        setSelectedSection(sectionList[0].id);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
      setMessage({ type: 'error', text: 'Failed to load sections' });
    }
  };

  const loadSectionAttendance = async () => {
    if (!selectedSection || !selectedDate) return;

    setLoading(true);
    try {
      const section = sections.find(s => s.id === selectedSection);
      if (!section) return;

      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Get existing attendance for this section and period
      const existingAttendance = await attendanceService.getPeriodAttendance(
        dateStr,
        selectedSection,
        selectedPeriod
      );

      // Get students enrolled in this section
      const enrolledStudents = await schedulingService.getSectionEnrollment(selectedSection);

      // Map attendance data
      const attendanceMap = new Map<string, AttendanceEntry>();
      enrolledStudents.forEach(student => {
        const existing = existingAttendance.find(a => a.studentId === student.studentId);
        attendanceMap.set(student.studentId, {
          studentId: student.studentId,
          studentName: student.studentName,
          attendanceCode: existing?.attendanceCode || 'P',
          codeId: existing?.codeId || '1',
          comments: existing?.comments || ''
        });
      });
      setAttendanceData(attendanceMap);
    } catch (error) {
      console.error('Error loading section attendance:', error);
      setMessage({ type: 'error', text: 'Failed to load attendance data' });
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId: string, codeId: string) => {
    const code = attendanceCodes.find(c => c.id === codeId);
    if (code) {
      setAttendanceData(prev => {
        const newMap = new Map(prev);
        const entry = newMap.get(studentId);
        if (entry) {
          entry.attendanceCode = code.code;
          entry.codeId = code.id;
        }
        return newMap;
      });
    }
  };

  const handleCommentChange = (studentId: string, comment: string) => {
    setAttendanceData(prev => {
      const newMap = new Map(prev);
      const entry = newMap.get(studentId);
      if (entry) {
        entry.comments = comment;
      }
      return newMap;
    });
  };

  const handleBulkAttendance = (codeId: string) => {
    const code = attendanceCodes.find(c => c.id === codeId);
    if (code) {
      setAttendanceData(prev => {
        const newMap = new Map(prev);
        newMap.forEach((entry) => {
          entry.attendanceCode = code.code;
          entry.codeId = code.id;
        });
        return newMap;
      });
    }
  };

  const handleSave = async () => {
    if (!selectedDate || !selectedSection) return;

    setSaving(true);
    setMessage(null);
    
    try {
      const section = sections.find(s => s.id === selectedSection);
      if (!section) return;

      const dateStr = selectedDate.toISOString().split('T')[0];
      const attendanceRecords: PeriodAttendanceType[] = Array.from(attendanceData.values()).map(entry => ({
        date: dateStr,
        studentId: entry.studentId,
        studentName: entry.studentName,
        sectionId: selectedSection,
        sectionName: section.sectionName,
        periodNumber: selectedPeriod,
        attendanceCode: entry.attendanceCode,
        codeId: entry.codeId,
        comments: entry.comments
      }));

      await attendanceService.recordPeriodAttendance(attendanceRecords);
      setMessage({ type: 'success', text: 'Period attendance saved successfully' });
    } catch (error) {
      console.error('Error saving period attendance:', error);
      setMessage({ type: 'error', text: 'Failed to save period attendance' });
    } finally {
      setSaving(false);
    }
  };

  const getAttendanceColor = (code: string) => {
    switch (code) {
      case 'P': return 'success';
      case 'A': return 'error';
      case 'T': return 'warning';
      case 'EA': return 'info';
      case 'UA': return 'error';
      case 'FT': return 'info';
      default: return 'default';
    }
  };

  const currentSection = sections.find(s => s.id === selectedSection);

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Attendance Date"
                value={selectedDate}
                onChange={setSelectedDate}
                slotProps={{
                  textField: { fullWidth: true, size: 'small' }
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Period</InputLabel>
              <Select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                label="Period"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(period => (
                  <MenuItem key={period} value={period}>
                    Period {period}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Section</InputLabel>
              <Select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                label="Section"
              >
                {sections.map(section => (
                  <MenuItem key={section.id} value={section.id}>
                    {section.sectionName} - {section.courseName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving || attendanceData.size === 0}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              fullWidth
            >
              Save Attendance
            </Button>
          </Grid>
        </Grid>

        {message && (
          <Alert severity={message.type} sx={{ mt: 2 }}>
            {message.text}
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6">
              Period {selectedPeriod} Attendance
            </Typography>
            {currentSection && (
              <Typography variant="subtitle2" color="textSecondary">
                {currentSection.sectionName} - {currentSection.courseName}
              </Typography>
            )}
          </Box>
          <Box display="flex" gap={1}>
            {attendanceCodes.slice(0, 4).map(code => (
              <Button
                key={code.id}
                variant="outlined"
                size="small"
                onClick={() => handleBulkAttendance(code.id)}
                color={getAttendanceColor(code.code) as any}
              >
                All {code.code}
              </Button>
            ))}
          </Box>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : attendanceData.size === 0 ? (
          <Typography align="center" color="textSecondary" py={4}>
            No students enrolled in this section
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Attendance</TableCell>
                  <TableCell>Comments</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from(attendanceData.entries()).map(([studentId, entry]) => (
                  <TableRow key={studentId}>
                    <TableCell>{studentId}</TableCell>
                    <TableCell>{entry.studentName}</TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                          value={entry.codeId}
                          onChange={(e) => handleAttendanceChange(studentId, e.target.value)}
                        >
                          {attendanceCodes.map(code => (
                            <MenuItem key={code.id} value={code.id}>
                              <Chip
                                label={`${code.code} - ${code.description}`}
                                size="small"
                                color={getAttendanceColor(code.code) as any}
                              />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        placeholder="Add comment..."
                        value={entry.comments}
                        onChange={(e) => handleCommentChange(studentId, e.target.value)}
                        fullWidth
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default PeriodAttendance;