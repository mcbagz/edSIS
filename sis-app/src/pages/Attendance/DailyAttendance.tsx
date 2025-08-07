import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import attendanceService from '../../services/attendanceService';
import { studentService } from '../../services/studentService';
import type { AttendanceCode, DailyAttendance as DailyAttendanceType } from '../../services/attendanceService';
import type { Student } from '../../types/student';

interface AttendanceEntry {
  studentId: string;
  studentName: string;
  gradeLevel: string;
  attendanceCode: string;
  codeId: string;
  comments: string;
}

const DailyAttendance: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceCodes, setAttendanceCodes] = useState<AttendanceCode[]>([]);
  const [attendanceData, setAttendanceData] = useState<Map<string, AttendanceEntry>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Fetch attendance codes on mount
  useEffect(() => {
    loadAttendanceCodes();
  }, []);

  // Fetch students when grade changes
  useEffect(() => {
    if (selectedDate) {
      loadStudentsAndAttendance();
    }
  }, [selectedGrade, selectedDate]);

  const loadAttendanceCodes = async () => {
    try {
      const codes = await attendanceService.getAttendanceCodes();
      setAttendanceCodes(codes);
    } catch (error) {
      console.error('Error loading attendance codes:', error);
      setMessage({ type: 'error', text: 'Failed to load attendance codes' });
    }
  };

  const loadStudentsAndAttendance = async () => {
    setLoading(true);
    try {
      // Load students based on grade
      const response = await studentService.getStudents({
        gradeLevel: selectedGrade === 'all' ? undefined : selectedGrade
      });
      setStudents(response.students);

      // Load existing attendance for the date
      if (selectedDate) {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const existingAttendance = await attendanceService.getDailyAttendance(
          dateStr,
          undefined,
          selectedGrade === 'all' ? undefined : selectedGrade
        );

        // Map existing attendance to students
        const attendanceMap = new Map<string, AttendanceEntry>();
        response.students.forEach(student => {
          const existing = existingAttendance.find(a => a.studentId === student.id);
          attendanceMap.set(student.id, {
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName || student.lastSurname}`,
            gradeLevel: student.gradeLevel || '',
            attendanceCode: existing?.attendanceCode || 'P',
            codeId: existing?.codeId || '1',
            comments: existing?.comments || ''
          });
        });
        setAttendanceData(attendanceMap);
      }
    } catch (error) {
      console.error('Error loading students and attendance:', error);
      setMessage({ type: 'error', text: 'Failed to load student data' });
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
    if (!selectedDate) return;

    setSaving(true);
    setMessage(null);
    
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const attendanceRecords: DailyAttendanceType[] = Array.from(attendanceData.values()).map(entry => ({
        date: dateStr,
        studentId: entry.studentId,
        studentName: entry.studentName,
        attendanceCode: entry.attendanceCode,
        codeId: entry.codeId,
        comments: entry.comments
      }));

      await attendanceService.recordDailyAttendance(attendanceRecords);
      setMessage({ type: 'success', text: 'Attendance saved successfully' });
    } catch (error) {
      console.error('Error saving attendance:', error);
      setMessage({ type: 'error', text: 'Failed to save attendance' });
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't handle shortcuts when typing in input fields
      }

      const code = attendanceCodes.find(c => c.shortcut === e.key);
      if (code && e.ctrlKey) {
        e.preventDefault();
        handleBulkAttendance(code.id);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [attendanceCodes]);

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
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Grade Level</InputLabel>
              <Select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                label="Grade Level"
              >
                <MenuItem value="all">All Grades</MenuItem>
                <MenuItem value="K">Kindergarten</MenuItem>
                <MenuItem value="1">Grade 1</MenuItem>
                <MenuItem value="2">Grade 2</MenuItem>
                <MenuItem value="3">Grade 3</MenuItem>
                <MenuItem value="4">Grade 4</MenuItem>
                <MenuItem value="5">Grade 5</MenuItem>
                <MenuItem value="6">Grade 6</MenuItem>
                <MenuItem value="7">Grade 7</MenuItem>
                <MenuItem value="8">Grade 8</MenuItem>
                <MenuItem value="9">Grade 9</MenuItem>
                <MenuItem value="10">Grade 10</MenuItem>
                <MenuItem value="11">Grade 11</MenuItem>
                <MenuItem value="12">Grade 12</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={saving || students.length === 0}
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                Save Attendance
              </Button>
              <IconButton onClick={loadStudentsAndAttendance} disabled={loading}>
                <RefreshIcon />
              </IconButton>
              <Tooltip title="Keyboard Shortcuts">
                <IconButton onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}>
                  <KeyboardIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>

        {showKeyboardShortcuts && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Keyboard Shortcuts (Hold Ctrl):
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {attendanceCodes.map(code => (
                <Chip
                  key={code.id}
                  label={`${code.shortcut}: ${code.description}`}
                  size="small"
                  color={getAttendanceColor(code.code) as any}
                />
              ))}
            </Box>
          </Box>
        )}

        {message && (
          <Alert severity={message.type} sx={{ mt: 2 }}>
            {message.text}
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Daily Attendance - {selectedDate?.toLocaleDateString()}
          </Typography>
          <Box display="flex" gap={1}>
            {attendanceCodes.map(code => (
              <Button
                key={code.id}
                variant="outlined"
                size="small"
                onClick={() => handleBulkAttendance(code.id)}
                color={getAttendanceColor(code.code) as any}
              >
                Mark All {code.code}
              </Button>
            ))}
          </Box>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : students.length === 0 ? (
          <Typography align="center" color="textSecondary" py={4}>
            No students found for the selected grade level
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Attendance</TableCell>
                  <TableCell>Comments</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => {
                  const entry = attendanceData.get(student.id);
                  return (
                    <TableRow key={student.id}>
                      <TableCell>{student.studentId || student.studentUniqueId}</TableCell>
                      <TableCell>{`${student.firstName} ${student.lastName || student.lastSurname}`}</TableCell>
                      <TableCell>{student.gradeLevel}</TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={entry?.codeId || '1'}
                            onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
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
                          value={entry?.comments || ''}
                          onChange={(e) => handleCommentChange(student.id, e.target.value)}
                          fullWidth
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default DailyAttendance;