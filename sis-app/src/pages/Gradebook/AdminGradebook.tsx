import React, { useState } from 'react';
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
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  School,
  TrendingUp,
  TrendingDown,
  Assessment,
  People,
  EmojiEvents,
  Search,
  Download,
  FilterList,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Button } from '../../components';

interface GPAStudent {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  gradeLevel: string;
  gpa: number;
  totalCredits: number;
  rank: number;
}

interface GradeDistribution {
  gradeLevel: string;
  averageGPA: number;
  totalStudents: number;
  distribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
}

interface DashboardStats {
  totalStudents: number;
  averageGPA: number;
  honorRollCount: number;
  failingStudents: number;
  perfectGPACount: number;
}

export const AdminGradebook: React.FC = () => {
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('all');
  const [selectedTerm, setSelectedTerm] = useState<string>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'rankings' | 'distribution'>('overview');

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['gradebook-stats', selectedGradeLevel, selectedTerm],
    queryFn: async () => {
      const response = await api.get('/gradebook/admin/statistics', {
        params: { gradeLevel: selectedGradeLevel, term: selectedTerm },
      });
      return response.data as DashboardStats;
    },
  });

  // Fetch GPA rankings
  const { data: rankings, isLoading: rankingsLoading } = useQuery({
    queryKey: ['gpa-rankings', selectedGradeLevel, selectedTerm],
    queryFn: async () => {
      const response = await api.get('/gradebook/admin/gpa-rankings', {
        params: { gradeLevel: selectedGradeLevel, term: selectedTerm },
      });
      return response.data as GPAStudent[];
    },
  });

  // Fetch grade distribution
  const { data: distribution, isLoading: distributionLoading } = useQuery({
    queryKey: ['grade-distribution', selectedTerm],
    queryFn: async () => {
      const response = await api.get('/gradebook/admin/grade-distribution', {
        params: { term: selectedTerm },
      });
      return response.data as GradeDistribution[];
    },
  });

  const handleExportReport = async (reportType: string) => {
    try {
      const response = await api.get(`/gradebook/admin/export/${reportType}`, {
        params: { gradeLevel: selectedGradeLevel, term: selectedTerm },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const filteredRankings = rankings?.filter(student =>
    `${student.firstName} ${student.lastName} ${student.studentId}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const getGPAColor = (gpa: number) => {
    if (gpa >= 3.5) return 'success';
    if (gpa >= 3.0) return 'info';
    if (gpa >= 2.5) return 'warning';
    return 'error';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <Box>
      {/* Header and Filters */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Gradebook Administration
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Grade Level</InputLabel>
              <Select
                value={selectedGradeLevel}
                onChange={(e) => setSelectedGradeLevel(e.target.value)}
                label="Grade Level"
              >
                <MenuItem value="all">All Grades</MenuItem>
                <MenuItem value="9">Grade 9</MenuItem>
                <MenuItem value="10">Grade 10</MenuItem>
                <MenuItem value="11">Grade 11</MenuItem>
                <MenuItem value="12">Grade 12</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Term</InputLabel>
              <Select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                label="Term"
              >
                <MenuItem value="current">Current Term</MenuItem>
                <MenuItem value="fall2024">Fall 2024</MenuItem>
                <MenuItem value="spring2024">Spring 2024</MenuItem>
                <MenuItem value="fall2023">Fall 2023</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={activeTab === 'overview' ? 'contained' : 'outlined'}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </Button>
              <Button
                variant={activeTab === 'rankings' ? 'contained' : 'outlined'}
                onClick={() => setActiveTab('rankings')}
              >
                GPA Rankings
              </Button>
              <Button
                variant={activeTab === 'distribution' ? 'contained' : 'outlined'}
                onClick={() => setActiveTab('distribution')}
              >
                Grade Distribution
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Total Students
                      </Typography>
                      <Typography variant="h4">
                        {statsLoading ? <CircularProgress size={24} /> : stats?.totalStudents || 0}
                      </Typography>
                    </Box>
                    <People sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Average GPA
                      </Typography>
                      <Typography variant="h4">
                        {statsLoading ? <CircularProgress size={24} /> : stats?.averageGPA?.toFixed(2) || '0.00'}
                      </Typography>
                    </Box>
                    <Assessment sx={{ fontSize: 40, color: 'info.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Honor Roll
                      </Typography>
                      <Typography variant="h4">
                        {statsLoading ? <CircularProgress size={24} /> : stats?.honorRollCount || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        GPA ≥ 3.5
                      </Typography>
                    </Box>
                    <EmojiEvents sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        At Risk
                      </Typography>
                      <Typography variant="h4" color="error">
                        {statsLoading ? <CircularProgress size={24} /> : stats?.failingStudents || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        GPA &lt; 2.0
                      </Typography>
                    </Box>
                    <TrendingDown sx={{ fontSize: 40, color: 'error.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Quick Actions */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  icon={<Download />}
                  onClick={() => handleExportReport('honor-roll')}
                >
                  Export Honor Roll
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  icon={<Download />}
                  onClick={() => handleExportReport('at-risk')}
                >
                  Export At-Risk Students
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  icon={<Download />}
                  onClick={() => handleExportReport('full-grades')}
                >
                  Export Full Grade Report
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  icon={<Download />}
                  onClick={() => handleExportReport('transcripts')}
                >
                  Bulk Generate Transcripts
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}

      {/* GPA Rankings Tab */}
      {activeTab === 'rankings' && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">GPA Rankings</Typography>
            <TextField
              size="small"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {rankingsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Grade Level</TableCell>
                    <TableCell align="center">GPA</TableCell>
                    <TableCell align="center">Credits</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRankings?.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getRankIcon(student.rank)}
                          <Typography variant="body2" sx={{ fontWeight: student.rank <= 3 ? 'bold' : 'normal' }}>
                            #{student.rank}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {student.firstName} {student.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>Grade {student.gradeLevel}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={student.gpa.toFixed(2)}
                          color={getGPAColor(student.gpa)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">{student.totalCredits}</TableCell>
                      <TableCell>
                        {student.gpa >= 3.5 && (
                          <Chip label="Honor Roll" color="success" size="small" />
                        )}
                        {student.gpa >= 3.8 && (
                          <Chip label="High Honor" color="primary" size="small" sx={{ ml: 1 }} />
                        )}
                        {student.gpa < 2.0 && (
                          <Chip label="At Risk" color="error" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Grade Distribution Tab */}
      {activeTab === 'distribution' && (
        <Grid container spacing={3}>
          {distributionLoading ? (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            </Grid>
          ) : (
            distribution?.map((grade) => (
              <Grid item xs={12} md={6} key={grade.gradeLevel}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Grade {grade.gradeLevel}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Average GPA</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {grade.averageGPA.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Total Students</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {grade.totalStudents}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Grade Distribution
                  </Typography>
                  {Object.entries(grade.distribution).map(([letter, count]) => (
                    <Box key={letter} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{letter} Grade</Typography>
                        <Typography variant="body2">
                          {count} ({((count / grade.totalStudents) * 100).toFixed(1)}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(count / grade.totalStudents) * 100}
                        color={letter === 'A' ? 'success' : letter === 'F' ? 'error' : 'primary'}
                      />
                    </Box>
                  ))}
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Box>
  );
};

export default AdminGradebook;