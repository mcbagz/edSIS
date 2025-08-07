import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Grid,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Visibility,
  Edit,
  Delete,
  PersonAdd,
  Search as SearchIcon,
  FilterList,
  Clear,
  School,
  Person,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { studentService } from '../../services/studentService';
import type { Student } from '../../types/student';
import { useAuth } from '../../contexts/AuthContext';
import { PermissionGuard } from '../../components/PermissionGuard';
import { hasPermission } from '../../utils/permissions';
import { Table, Button, Input, useToast, Breadcrumbs } from '../../components';
import type { TableColumn } from '../../components';

export const StudentsList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gradeLevel: '',
    enrollmentStatus: 'Active',
    gender: '',
    ethnicity: '',
  });
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['students', debouncedSearchTerm, filters, page, pageSize],
    queryFn: () =>
      studentService.searchStudents({
        q: debouncedSearchTerm,
        gradeLevel: filters.gradeLevel || undefined,
        enrollmentStatus: filters.enrollmentStatus || undefined,
        gender: filters.gender || undefined,
        ethnicity: filters.ethnicity || undefined,
        limit: pageSize,
        offset: page * pageSize,
      }),
  });

  const canCreateStudent = hasPermission(user?.role, 'students.create');
  const canEditStudent = hasPermission(user?.role, 'students.edit');
  const canDeleteStudent = hasPermission(user?.role, 'students.delete');

  const handleViewStudent = useCallback((studentId: string) => {
    navigate(`/students/${studentId}`);
  }, [navigate]);

  const handleEditStudent = useCallback((studentId: string) => {
    navigate(`/students/${studentId}/edit`);
  }, [navigate]);

  const handleDeleteStudent = useCallback(async (studentId: string) => {
    if (window.confirm('Are you sure you want to deactivate this student?')) {
      try {
        await studentService.deleteStudent(studentId);
        toast.success('Student deactivated successfully');
        refetch();
      } catch (error) {
        toast.error('Failed to deactivate student');
      }
    }
  }, [toast, refetch]);

  const handleFilterChange = (field: string) => (event: SelectChangeEvent) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setPage(0); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      gradeLevel: '',
      enrollmentStatus: 'Active',
      gender: '',
      ethnicity: '',
    });
    setSearchTerm('');
    setPage(0);
  };

  const activeFilterCount = Object.values(filters).filter(v => v && v !== 'Active').length;

  const columns: TableColumn<Student>[] = useMemo(() => [
    {
      field: 'studentUniqueId',
      headerName: 'Student ID',
      width: 120,
      sortable: true,
    },
    {
      field: 'fullName',
      headerName: 'Name',
      flex: 1,
      minWidth: 200,
      sortable: true,
      renderCell: (params) => {
        const student = params.row as Student;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person fontSize="small" color="action" />
            {`${student.firstName} ${student.middleName || ''} ${student.lastSurname}`.trim()}
          </Box>
        );
      },
    },
    {
      field: 'birthDate',
      headerName: 'Birth Date',
      width: 120,
      sortable: true,
      renderCell: (params) => {
        return new Date(params.value).toLocaleDateString();
      },
    },
    {
      field: 'gradeLevel',
      headerName: 'Grade',
      width: 100,
      align: 'center',
      renderCell: (params) => {
        const grade = params.value;
        return grade ? (
          <Chip 
            icon={<School fontSize="small" />}
            label={`Grade ${grade}`} 
            size="small" 
            variant="outlined" 
          />
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        );
      },
    },
    {
      field: 'gender',
      headerName: 'Gender',
      width: 100,
      renderCell: (params) => {
        const gender = params.row.birthSex || params.value;
        return gender ? (
          <Typography variant="body2">{gender}</Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        );
      },
    },
    {
      field: 'homeroom',
      headerName: 'Homeroom',
      width: 150,
      renderCell: (params) => {
        const homeroom = params.value;
        return homeroom ? (
          <Box>
            <Typography variant="body2">{homeroom.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {homeroom.teacher}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        );
      },
    },
    {
      field: 'enrollmentStatus',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const status = params.value || 'Active';
        return (
          <Chip 
            label={status} 
            size="small" 
            color={status === 'Active' ? 'success' : status === 'Inactive' ? 'default' : 'warning'}
            variant={status === 'Active' ? 'filled' : 'outlined'}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const student = params.row as Student;
        return (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleViewStudent(student.id);
              }}
              title="View student details"
            >
              <Visibility fontSize="small" />
            </IconButton>
            {canEditStudent && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditStudent(student.id);
                }}
                title="Edit student"
              >
                <Edit fontSize="small" />
              </IconButton>
            )}
            {canDeleteStudent && student.enrollmentStatus === 'Active' && (
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteStudent(student.id);
                }}
                title="Deactivate student"
              >
                <Delete fontSize="small" />
              </IconButton>
            )}
          </Box>
        );
      },
    },
  ], [canEditStudent, canDeleteStudent, handleViewStudent, handleEditStudent, handleDeleteStudent]);

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Students', path: '/students' },
  ];

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading students. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs items={breadcrumbItems} sx={{ mb: 2 }} />
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Students
        </Typography>
        <PermissionGuard permission="students.create">
          <Button
            variant="contained"
            icon={<PersonAdd />}
            onClick={() => navigate('/students/new')}
          >
            Add Student
          </Button>
        </PermissionGuard>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        {/* Search and Filter Bar */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <Input
            fullWidth
            placeholder="Search students by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<SearchIcon />}
            ariaLabel="Search students"
          />
          <Button
            variant={showFilters ? 'contained' : 'outlined'}
            icon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
            badge={activeFilterCount > 0 ? activeFilterCount : undefined}
          >
            Filters
          </Button>
          {(activeFilterCount > 0 || searchTerm) && (
            <Button
              variant="text"
              icon={<Clear />}
              onClick={handleClearFilters}
            >
              Clear
            </Button>
          )}
        </Box>

        {/* Advanced Filters */}
        <Collapse in={showFilters}>
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Advanced Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Grade Level</InputLabel>
                  <Select
                    value={filters.gradeLevel}
                    onChange={handleFilterChange('gradeLevel')}
                    label="Grade Level"
                  >
                    <MenuItem value="">All Grades</MenuItem>
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
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.enrollmentStatus}
                    onChange={handleFilterChange('enrollmentStatus')}
                    label="Status"
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                    <MenuItem value="Graduated">Graduated</MenuItem>
                    <MenuItem value="Transferred">Transferred</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={filters.gender}
                    onChange={handleFilterChange('gender')}
                    label="Gender"
                  >
                    <MenuItem value="">All Genders</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Ethnicity</InputLabel>
                  <Select
                    value={filters.ethnicity}
                    onChange={handleFilterChange('ethnicity')}
                    label="Ethnicity"
                  >
                    <MenuItem value="">All Ethnicities</MenuItem>
                    <MenuItem value="American Indian or Alaska Native">American Indian or Alaska Native</MenuItem>
                    <MenuItem value="Asian">Asian</MenuItem>
                    <MenuItem value="Black or African American">Black or African American</MenuItem>
                    <MenuItem value="Hispanic or Latino">Hispanic or Latino</MenuItem>
                    <MenuItem value="Native Hawaiian or Other Pacific Islander">Native Hawaiian or Other Pacific Islander</MenuItem>
                    <MenuItem value="White">White</MenuItem>
                    <MenuItem value="Two or More Races">Two or More Races</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </Collapse>

        {/* Results Summary */}
        {data && (
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {data.students?.length || 0} of {data.totalCount || 0} students
            </Typography>
            {data.hasMore && (
              <Typography variant="caption" color="text.secondary">
                More results available
              </Typography>
            )}
          </Box>
        )}
        
        {/* Students Table */}
        <Table
          rows={data?.students || []}
          columns={columns}
          loading={isLoading}
          pageSize={pageSize}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onRowClick={(student) => handleViewStudent(student.id)}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setPage(0);
          }}
          ariaLabel="Students table"
          autoHeight
          getRowId={(row) => row.id}
          pagination
          paginationMode="server"
          rowCount={data?.totalCount || 0}
          page={page}
        />
      </Paper>
    </Box>
  );
};