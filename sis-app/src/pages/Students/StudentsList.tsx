import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Alert,
  Chip,
} from '@mui/material';
import {
  Visibility,
  Edit,
  Delete,
  PersonAdd,
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
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data, isLoading, error } = useQuery({
    queryKey: ['students', debouncedSearchTerm, page, pageSize],
    queryFn: () =>
      studentService.getStudents({
        q: debouncedSearchTerm,
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
    // TODO: Implement delete confirmation dialog
    toast.info('Delete functionality not yet implemented');
  }, [toast]);

  const columns: TableColumn<Student>[] = useMemo(() => [
    {
      field: 'studentUniqueId',
      headerName: 'Student ID',
      width: 150,
      sortable: true,
    },
    {
      field: 'fullName',
      headerName: 'Name',
      flex: 1,
      sortable: true,
      renderCell: (params) => {
        const student = params.row as Student;
        return `${student.firstName} ${student.middleName || ''} ${student.lastSurname}`.trim();
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
      headerName: 'Grade Level',
      width: 120,
      renderCell: (params) => {
        // TODO: Get grade level from school associations
        return <Chip label="N/A" size="small" variant="outlined" />;
      },
    },
    {
      field: 'enrollmentStatus',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        // TODO: Get enrollment status from school associations
        return <Chip label="Active" size="small" color="success" />;
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => {
        const student = params.row as Student;
        return (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
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
            {canDeleteStudent && (
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteStudent(student.id);
                }}
                title="Delete student"
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
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Input
            fullWidth
            placeholder="Search students by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<SearchIcon />}
            ariaLabel="Search students"
          />
        </Box>
        
        <Table
          rows={data?.students || []}
          columns={columns}
          loading={isLoading}
          pageSize={pageSize}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onRowClick={(student) => handleViewStudent(student.id)}
          ariaLabel="Students table"
          autoHeight
        />
      </Paper>
    </Box>
  );
};

// Import SearchIcon separately to handle the icon
import { Search as SearchIcon } from '@mui/icons-material';