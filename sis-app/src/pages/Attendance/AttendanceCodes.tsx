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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import attendanceService from '../../services/attendanceService';
import type { AttendanceCode } from '../../services/attendanceService';

const AttendanceCodes: React.FC = () => {
  const [codes, setCodes] = useState<AttendanceCode[]>([]);
  const [editingCode, setEditingCode] = useState<AttendanceCode | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewCode, setIsNewCode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadAttendanceCodes();
  }, []);

  const loadAttendanceCodes = async () => {
    try {
      const attendanceCodes = await attendanceService.getAttendanceCodes();
      setCodes(attendanceCodes);
    } catch (error) {
      console.error('Error loading attendance codes:', error);
      setMessage({ type: 'error', text: 'Failed to load attendance codes' });
    }
  };

  const handleAddCode = () => {
    setEditingCode({
      id: '',
      code: '',
      description: '',
      category: 'present',
      shortcut: '',
      isActive: true
    });
    setIsNewCode(true);
    setIsDialogOpen(true);
  };

  const handleEditCode = (code: AttendanceCode) => {
    setEditingCode({ ...code });
    setIsNewCode(false);
    setIsDialogOpen(true);
  };

  const handleDeleteCode = async (codeId: string) => {
    if (!window.confirm('Are you sure you want to delete this attendance code?')) {
      return;
    }

    try {
      await attendanceService.deleteAttendanceCode(codeId);
      setMessage({ type: 'success', text: 'Attendance code deleted successfully' });
      loadAttendanceCodes();
    } catch (error) {
      console.error('Error deleting attendance code:', error);
      setMessage({ type: 'error', text: 'Failed to delete attendance code' });
    }
  };

  const handleSaveCode = async () => {
    if (!editingCode) return;

    try {
      if (isNewCode) {
        const { id, ...codeData } = editingCode;
        await attendanceService.createAttendanceCode(codeData);
        setMessage({ type: 'success', text: 'Attendance code created successfully' });
      } else {
        await attendanceService.updateAttendanceCode(editingCode.id, editingCode);
        setMessage({ type: 'success', text: 'Attendance code updated successfully' });
      }
      setIsDialogOpen(false);
      setEditingCode(null);
      loadAttendanceCodes();
    } catch (error) {
      console.error('Error saving attendance code:', error);
      setMessage({ type: 'error', text: 'Failed to save attendance code' });
    }
  };

  const handleCancelEdit = () => {
    setIsDialogOpen(false);
    setEditingCode(null);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'tardy': return 'warning';
      case 'excused': return 'info';
      case 'unexcused': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Attendance Code Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddCode}
          >
            Add New Code
          </Button>
        </Box>

        {message && (
          <Alert severity={message.type} sx={{ mt: 2 }}>
            {message.text}
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Keyboard Shortcut</TableCell>
                <TableCell align="center">Active</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {codes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell>
                    <Typography variant="h6">{code.code}</Typography>
                  </TableCell>
                  <TableCell>{code.description}</TableCell>
                  <TableCell>
                    <Chip
                      label={code.category}
                      color={getCategoryColor(code.category) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {code.shortcut && (
                      <Chip
                        label={`Ctrl + ${code.shortcut}`}
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Switch checked={code.isActive} disabled />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleEditCode(code)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteCode(code.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={isDialogOpen} onClose={handleCancelEdit} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isNewCode ? 'Add New Attendance Code' : 'Edit Attendance Code'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Code"
              value={editingCode?.code || ''}
              onChange={(e) => setEditingCode(prev => prev ? { ...prev, code: e.target.value } : null)}
              fullWidth
              required
              inputProps={{ maxLength: 5 }}
              helperText="Short code (e.g., P, A, T)"
            />
            
            <TextField
              label="Description"
              value={editingCode?.description || ''}
              onChange={(e) => setEditingCode(prev => prev ? { ...prev, description: e.target.value } : null)}
              fullWidth
              required
              helperText="Full description of the attendance code"
            />

            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={editingCode?.category || 'present'}
                onChange={(e) => setEditingCode(prev => prev ? { ...prev, category: e.target.value as any } : null)}
                label="Category"
              >
                <MenuItem value="present">Present</MenuItem>
                <MenuItem value="absent">Absent</MenuItem>
                <MenuItem value="tardy">Tardy</MenuItem>
                <MenuItem value="excused">Excused</MenuItem>
                <MenuItem value="unexcused">Unexcused</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Keyboard Shortcut"
              value={editingCode?.shortcut || ''}
              onChange={(e) => setEditingCode(prev => prev ? { ...prev, shortcut: e.target.value } : null)}
              fullWidth
              inputProps={{ maxLength: 1 }}
              helperText="Single key for quick entry (e.g., 1, 2, 3)"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={editingCode?.isActive || false}
                  onChange={(e) => setEditingCode(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveCode}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={!editingCode?.code || !editingCode?.description}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendanceCodes;