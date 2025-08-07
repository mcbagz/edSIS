import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Alert,
  InputAdornment,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as staffService from '../../services/staffService';
import { useToast, Breadcrumbs } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../utils/permissions';

interface Staff {
  id: string;
  staffUniqueId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  hireDate: string;
  user?: {
    email: string;
    role: string;
    isActive: boolean;
  };
  homerooms?: any[];
  courseSections?: any[];
}

interface StaffFormData {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: string;
  password: string;
  role: string;
}

const StaffManagement: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEditStaff = hasPermission(user?.role, 'staff.edit');
  const canDeleteStaff = hasPermission(user?.role, 'staff.delete');
  const canCreateStaff = hasPermission(user?.role, 'staff.create');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  
  const [formData, setFormData] = useState<StaffFormData>({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    position: 'Teacher',
    department: '',
    hireDate: format(new Date(), 'yyyy-MM-dd'),
    password: '',
    role: 'TEACHER',
  });

  // Fetch staff
  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['staff', selectedPosition, selectedDepartment],
    queryFn: () => staffService.getStaff({ 
      position: selectedPosition || undefined, 
      department: selectedDepartment || undefined 
    }),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['staffStats'],
    queryFn: () => staffService.getStaffStats(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: StaffFormData) => staffService.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staffStats'] });
      toast.showToast('Staff member created successfully', 'success');
      setFormDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.showToast(error.response?.data?.message || 'Failed to create staff member', 'error');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StaffFormData> }) => 
      staffService.updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.showToast('Staff member updated successfully', 'success');
      setFormDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.showToast(error.response?.data?.message || 'Failed to update staff member', 'error');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffService.deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staffStats'] });
      toast.showToast('Staff member deleted successfully', 'success');
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
    },
    onError: (error: any) => {
      toast.showToast(error.response?.data?.message || 'Failed to delete staff member', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      phone: '',
      position: 'Teacher',
      department: '',
      hireDate: format(new Date(), 'yyyy-MM-dd'),
      password: '',
      role: 'TEACHER',
    });
    setEditingStaff(null);
  };

  const handleOpenForm = (staff?: Staff) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        firstName: staff.firstName,
        lastName: staff.lastName,
        middleName: staff.middleName || '',
        email: staff.email,
        phone: staff.phone || '',
        position: staff.position,
        department: staff.department || '',
        hireDate: format(new Date(staff.hireDate), 'yyyy-MM-dd'),
        password: '',
        role: staff.user?.role || 'TEACHER',
      });
    } else {
      resetForm();
    }
    setFormDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.showToast('Please fill in all required fields', 'error');
      return;
    }

    if (!editingStaff && !formData.password) {
      toast.showToast('Password is required for new staff members', 'error');
      return;
    }

    if (editingStaff) {
      const updateData = { ...formData };
      delete updateData.password; // Don't send empty password on update
      updateMutation.mutate({ id: editingStaff.id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const confirmDelete = (id: string) => {
    setStaffToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (staffToDelete) {
      deleteMutation.mutate(staffToDelete);
    }
  };

  const filteredStaff = staffList.filter((member: Staff) => {
    const matchesSearch = searchTerm === '' || 
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.staffUniqueId.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const positions = [...new Set(staffList.map((s: Staff) => s.position))];
  const departments = [...new Set(staffList.map((s: Staff) => s.department).filter(Boolean))];

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Staff Management', path: '/staff' },
  ];

  return (
    <Box>
      <Breadcrumbs items={breadcrumbItems} sx={{ mb: 2 }} />
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1">
            Staff Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage teachers and administrative staff
          </Typography>
        </Box>
        {canCreateStaff && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
          >
            Add Staff Member
          </Button>
        )}
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Staff
                    </Typography>
                    <Typography variant="h4">
                      {stats.total}
                    </Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 40, color: 'action.disabled' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Active
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {stats.active}
                    </Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Inactive
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      {stats.inactive}
                    </Typography>
                  </Box>
                  <CancelIcon sx={{ fontSize: 40, color: 'error.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Departments
                    </Typography>
                    <Typography variant="h4">
                      {stats.byDepartment?.length || 0}
                    </Typography>
                  </Box>
                  <SchoolIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Staff List */}
      <Paper sx={{ p: 3 }}>
        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Position</InputLabel>
              <Select
                value={selectedPosition}
                onChange={(e: SelectChangeEvent) => setSelectedPosition(e.target.value)}
                label="Position"
              >
                <MenuItem value="">All positions</MenuItem>
                {positions.map(position => (
                  <MenuItem key={position} value={position}>
                    {position}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Department</InputLabel>
              <Select
                value={selectedDepartment}
                onChange={(e: SelectChangeEvent) => setSelectedDepartment(e.target.value)}
                label="Department"
              >
                <MenuItem value="">All departments</MenuItem>
                {departments.map(dept => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Staff Table */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredStaff.length === 0 ? (
          <Alert severity="info">No staff members found</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Staff Member</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Hire Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStaff.map((member: Staff) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getInitials(member.firstName, member.lastName)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {member.firstName} {member.middleName} {member.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.staffUniqueId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{member.position}</TableCell>
                    <TableCell>{member.department || '-'}</TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 16, color: 'action.disabled' }} />
                          <Typography variant="body2">{member.email}</Typography>
                        </Box>
                        {member.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 16, color: 'action.disabled' }} />
                            <Typography variant="body2">{member.phone}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'action.disabled' }} />
                        <Typography variant="body2">
                          {format(new Date(member.hireDate), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={member.user?.isActive ? 'Active' : 'Inactive'}
                        color={member.user?.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/staff/${member.id}`)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {canEditStaff && (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenForm(member)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDeleteStaff && (
                          <Tooltip title="Delete">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => confirmDelete(member.id)}
                                disabled={
                                  (member.homerooms && member.homerooms.length > 0) ||
                                  (member.courseSections && member.courseSections.length > 0)
                                }
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add/Edit Staff Dialog */}
      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Middle Name"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Position</InputLabel>
                <Select
                  value={formData.position}
                  onChange={(e: SelectChangeEvent) => setFormData({ ...formData, position: e.target.value })}
                  label="Position"
                >
                  <MenuItem value="Teacher">Teacher</MenuItem>
                  <MenuItem value="Principal">Principal</MenuItem>
                  <MenuItem value="Vice Principal">Vice Principal</MenuItem>
                  <MenuItem value="Counselor">Counselor</MenuItem>
                  <MenuItem value="Administrator">Administrator</MenuItem>
                  <MenuItem value="Support Staff">Support Staff</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g., Mathematics, Science, English"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hire Date"
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>System Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e: SelectChangeEvent) => setFormData({ ...formData, role: e.target.value })}
                  label="System Role"
                >
                  <MenuItem value="ADMIN">Administrator</MenuItem>
                  <MenuItem value="TEACHER">Teacher</MenuItem>
                  <MenuItem value="STAFF">Staff</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {!editingStaff && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Temporary Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  helperText="User will be prompted to change on first login"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {editingStaff ? 'Update' : 'Create'} Staff Member
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this staff member? This will also delete their user account.
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            color="error"
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffManagement;