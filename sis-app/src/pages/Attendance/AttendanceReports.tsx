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
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Collapse,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import attendanceService from '../../services/attendanceService';
import { studentService } from '../../services/studentService';
import schedulingService from '../../services/schedulingService';
import type { AttendanceReport, AttendanceStats } from '../../services/attendanceService';
import type { Student } from '../../types/student';
import type { Section } from '../../services/schedulingService';

const AttendanceReports: React.FC = () => {
  const [reportType, setReportType] = useState<'student' | 'class' | 'school'>('student');
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [reportData, setReportData] = useState<AttendanceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadStudents();
    loadSections();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await studentService.getStudents();
      setStudents(response.students);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadSections = async () => {
    try {
      const sectionList = await schedulingService.getSections();
      setSections(sectionList);
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    setReportData([]);

    try {
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      if (reportType === 'student' && selectedStudent) {
        const report = await attendanceService.getStudentAttendanceReport(
          selectedStudent,
          startStr,
          endStr
        );
        // Get student details
        const student = students.find(s => s.id === selectedStudent);
        if (student) {
          report.studentName = `${student.firstName} ${student.lastName || student.lastSurname}`;
          report.gradeLevel = student.gradeLevel || '';
        }
        setReportData([report]);
      } else if (reportType === 'class' && selectedSection) {
        const reports = await attendanceService.getClassAttendanceReport(
          selectedSection,
          startStr,
          endStr
        );
        // Enrich with student names
        reports.forEach(report => {
          const student = students.find(s => s.id === report.studentId);
          if (student) {
            report.studentName = `${student.firstName} ${student.lastName || student.lastSurname}`;
            report.gradeLevel = student.gradeLevel || '';
          }
        });
        setReportData(reports);
      } else if (reportType === 'school') {
        // For school-wide report, get all students in selected grade
        const gradeStudents = selectedGrade === 'all' 
          ? students 
          : students.filter(s => s.gradeLevel === selectedGrade);

        const reports: AttendanceReport[] = [];
        for (const student of gradeStudents) {
          const report = await attendanceService.getStudentAttendanceReport(
            student.id,
            startStr,
            endStr
          );
          report.studentName = `${student.firstName} ${student.lastName || student.lastSurname}`;
          report.gradeLevel = student.gradeLevel || '';
          reports.push(report);
        }
        setReportData(reports);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    // Convert report data to CSV
    const headers = ['Student ID', 'Student Name', 'Grade', 'Present', 'Absent', 'Tardy', 'Excused', 'Unexcused', 'Attendance Rate'];
    const rows = reportData.map(report => [
      report.studentId,
      report.studentName,
      report.gradeLevel,
      report.stats.present,
      report.stats.absent,
      report.stats.tardy,
      report.stats.excused,
      report.stats.unexcused,
      `${report.stats.attendanceRate.toFixed(2)}%`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleRowExpanded = (studentId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 95) return 'success';
    if (rate >= 90) return 'info';
    if (rate >= 85) return 'warning';
    return 'error';
  };

  const renderStatsCard = (stats: AttendanceStats) => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Days
            </Typography>
            <Typography variant="h4">
              {stats.totalDays}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Present
            </Typography>
            <Typography variant="h4" color="success.main">
              {stats.present}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Absent
            </Typography>
            <Typography variant="h4" color="error.main">
              {stats.absent}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Attendance Rate
            </Typography>
            <Typography variant="h4">
              {stats.attendanceRate.toFixed(1)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={stats.attendanceRate}
              color={getAttendanceRateColor(stats.attendanceRate) as any}
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Generate Attendance Report
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                label="Report Type"
              >
                <MenuItem value="student">Individual Student</MenuItem>
                <MenuItem value="class">Class/Section</MenuItem>
                <MenuItem value="school">School-Wide</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {reportType === 'student' && (
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Student</InputLabel>
                <Select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  label="Student"
                >
                  {students.map(student => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName || student.lastSurname} ({student.studentId || student.studentUniqueId})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {reportType === 'class' && (
            <Grid item xs={12} sm={3}>
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
          )}

          {reportType === 'school' && (
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
          )}

          <Grid item xs={12} sm={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                slotProps={{
                  textField: { fullWidth: true, size: 'small' }
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} sm={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                slotProps={{
                  textField: { fullWidth: true, size: 'small' }
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} sm={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerateReport}
              disabled={loading}
              startIcon={<SearchIcon />}
              fullWidth
            >
              Generate
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading && <LinearProgress />}

      {reportData.length > 0 && (
        <>
          {reportType === 'student' && reportData[0] && (
            <Box mb={2}>
              {renderStatsCard(reportData[0].stats)}
            </Box>
          )}

          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Attendance Report Results
              </Typography>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportReport}
              >
                Export CSV
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {reportType !== 'student' && <TableCell />}
                    <TableCell>Student ID</TableCell>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell align="center">Present</TableCell>
                    <TableCell align="center">Absent</TableCell>
                    <TableCell align="center">Tardy</TableCell>
                    <TableCell align="center">Excused</TableCell>
                    <TableCell align="center">Unexcused</TableCell>
                    <TableCell align="center">Attendance Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.map((report) => (
                    <React.Fragment key={report.studentId}>
                      <TableRow>
                        {reportType !== 'student' && (
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => toggleRowExpanded(report.studentId)}
                            >
                              {expandedRows.has(report.studentId) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </TableCell>
                        )}
                        <TableCell>{report.studentId}</TableCell>
                        <TableCell>{report.studentName}</TableCell>
                        <TableCell>{report.gradeLevel}</TableCell>
                        <TableCell align="center">
                          <Chip label={report.stats.present} color="success" size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={report.stats.absent} color="error" size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={report.stats.tardy} color="warning" size="small" />
                        </TableCell>
                        <TableCell align="center">{report.stats.excused}</TableCell>
                        <TableCell align="center">{report.stats.unexcused}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${report.stats.attendanceRate.toFixed(1)}%`}
                            color={getAttendanceRateColor(report.stats.attendanceRate) as any}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      {reportType !== 'student' && (
                        <TableRow>
                          <TableCell colSpan={10} sx={{ paddingBottom: 0, paddingTop: 0 }}>
                            <Collapse in={expandedRows.has(report.studentId)} timeout="auto" unmountOnExit>
                              <Box sx={{ margin: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Recent Attendance Records
                                </Typography>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Date</TableCell>
                                      <TableCell>Code</TableCell>
                                      <TableCell>Comments</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {report.records.slice(0, 5).map((record, idx) => (
                                      <TableRow key={idx}>
                                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{record.attendanceCode}</TableCell>
                                        <TableCell>{record.comments}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default AttendanceReports;