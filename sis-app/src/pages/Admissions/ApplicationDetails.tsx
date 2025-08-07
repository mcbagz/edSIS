import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Skeleton,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack,
  Person,
  School,
  ContactPhone,
  Email,
  LocationOn,
  CalendarToday,
  Description,
  CheckCircle,
  Cancel as CancelIcon,
  Edit,
  Download,
  Upload,
  Notes,
  Assignment,
  Phone,
  Home,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '../../services/applicationService';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Breadcrumbs, useToast } from '../../components';
import { PermissionGuard } from '../../components/PermissionGuard';
import { hasPermission } from '../../utils/permissions';

interface ApplicationDetailsData {
  id: string;
  prospectiveStudent: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender?: string;
    ethnicity?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    guardianName: string;
    guardianEmail: string;
    guardianPhone: string;
    guardianRelation: string;
  };
  status: 'APPLIED' | 'ACCEPTED' | 'REJECTED';
  applicationDate: string;
  documents?: any;
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  acceptanceEmailSent: boolean;
}

export const ApplicationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  
  const [statusDialog, setStatusDialog] = useState(false);
  const [notesDialog, setNotesDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<'ACCEPTED' | 'REJECTED' | ''>('');
  const [newNotes, setNewNotes] = useState('');
  const [statusReason, setStatusReason] = useState('');

  const { data: application, isLoading, error } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationService.getApplicationById(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { status: string; notes?: string }) => 
      applicationService.updateApplicationStatus(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application status updated successfully');
      setStatusDialog(false);
      setNewStatus('');
      setStatusReason('');
    },
    onError: () => {
      toast.error('Failed to update application status');
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: (notes: string) => 
      applicationService.updateApplicationNotes(id!, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      toast.success('Notes updated successfully');
      setNotesDialog(false);
      setNewNotes('');
    },
    onError: () => {
      toast.error('Failed to update notes');
    },
  });

  const sendAcceptanceEmailMutation = useMutation({
    mutationFn: () => applicationService.sendAcceptanceEmail(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      toast.success('Acceptance email sent successfully');
    },
    onError: () => {
      toast.error('Failed to send acceptance email');
    },
  });

  const handleStatusChange = () => {
    if (newStatus && id) {
      const notes = statusReason ? 
        `Status changed to ${newStatus}. Reason: ${statusReason}` : 
        `Status changed to ${newStatus}`;
      updateStatusMutation.mutate({ 
        status: newStatus, 
        notes: application?.notes ? `${application.notes}\n\n${notes}` : notes 
      });
    }
  };

  const handleNotesUpdate = () => {
    if (newNotes && id) {
      updateNotesMutation.mutate(
        application?.notes ? `${application.notes}\n\n${newNotes}` : newNotes
      );
    }
  };

  const handleEnrollStudent = () => {
    if (application?.status === 'ACCEPTED') {
      navigate(`/enrollment/${application.prospectiveStudent.id}`);
    }
  };

  const canEditApplication = hasPermission(user?.role, 'admissions.edit');

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Admissions', path: '/admissions' },
    { label: 'Applications', path: '/admissions/applications' },
    { label: application ? `${application.prospectiveStudent.firstName} ${application.prospectiveStudent.lastName}` : 'Application Details' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'APPLIED':
      default:
        return 'warning';
    }
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading application. Please try again later.
        </Alert>
        <Button
          icon={<ArrowBack />}
          iconPosition="start"
          onClick={() => navigate('/admissions/applications')}
        >
          Back to Applications
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs items={breadcrumbItems} sx={{ mb: 2 }} />
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="text"
            icon={<ArrowBack />}
            iconPosition="start"
            onClick={() => navigate('/admissions/applications')}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            Application Details
          </Typography>
        </Box>
        {application && canEditApplication && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            {application.status === 'ACCEPTED' && !application.acceptanceEmailSent && (
              <Button
                variant="outlined"
                icon={<Email />}
                iconPosition="start"
                onClick={() => sendAcceptanceEmailMutation.mutate()}
                disabled={sendAcceptanceEmailMutation.isPending}
              >
                Send Acceptance Email
              </Button>
            )}
            {application.status === 'ACCEPTED' && (
              <Button
                variant="contained"
                color="success"
                icon={<School />}
                iconPosition="start"
                onClick={handleEnrollStudent}
              >
                Enroll Student
              </Button>
            )}
          </Box>
        )}
      </Box>

      {isLoading ? (
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
            <Grid item xs={12}>
              <Skeleton variant="rectangular" height={300} />
            </Grid>
          </Grid>
        </Paper>
      ) : application ? (
        <>
          {/* Application Header Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs>
                  <Typography variant="h5" gutterBottom>
                    {application.prospectiveStudent.firstName} {application.prospectiveStudent.lastName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Chip
                      label={application.status}
                      color={getStatusColor(application.status)}
                      size="medium"
                    />
                    {application.acceptanceEmailSent && (
                      <Chip
                        icon={<Email />}
                        label="Acceptance Email Sent"
                        size="small"
                        variant="outlined"
                        color="success"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Applied on {new Date(application.applicationDate).toLocaleDateString()}
                  </Typography>
                  {application.reviewedAt && (
                    <Typography variant="body2" color="text.secondary">
                      Reviewed on {new Date(application.reviewedAt).toLocaleDateString()} by {application.reviewedBy}
                    </Typography>
                  )}
                </Grid>
                {canEditApplication && application.status === 'APPLIED' && (
                  <Grid item>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        icon={<CheckCircle />}
                        onClick={() => {
                          setNewStatus('ACCEPTED');
                          setStatusDialog(true);
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        icon={<CancelIcon />}
                        onClick={() => {
                          setNewStatus('REJECTED');
                          setStatusDialog(true);
                        }}
                      >
                        Reject
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            {/* Student Information */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person sx={{ mr: 1 }} />
                  <Typography variant="h6">Student Information</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {application.prospectiveStudent.firstName} {application.prospectiveStudent.lastName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Date of Birth</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {new Date(application.prospectiveStudent.dateOfBirth).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Gender</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {application.prospectiveStudent.gender || 'Not specified'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Ethnicity</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {application.prospectiveStudent.ethnicity || 'Not specified'}
                    </Typography>
                  </Grid>
                  {application.prospectiveStudent.email && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Email fontSize="small" color="action" />
                        <Typography variant="body2">
                          {application.prospectiveStudent.email}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  {application.prospectiveStudent.phone && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone fontSize="small" color="action" />
                        <Typography variant="body2">
                          {application.prospectiveStudent.phone}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  {application.prospectiveStudent.address && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Home fontSize="small" color="action" />
                        <Typography variant="body2">
                          {application.prospectiveStudent.address}
                          {application.prospectiveStudent.city && `, ${application.prospectiveStudent.city}`}
                          {application.prospectiveStudent.state && `, ${application.prospectiveStudent.state}`}
                          {application.prospectiveStudent.zipCode && ` ${application.prospectiveStudent.zipCode}`}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>

            {/* Guardian Information */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ContactPhone sx={{ mr: 1 }} />
                  <Typography variant="h6">Guardian Information</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Guardian Name</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {application.prospectiveStudent.guardianName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Relationship</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {application.prospectiveStudent.guardianRelation}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email fontSize="small" color="action" />
                      <Typography variant="body2">
                        {application.prospectiveStudent.guardianEmail}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone fontSize="small" color="action" />
                      <Typography variant="body2">
                        {application.prospectiveStudent.guardianPhone}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Documents */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Description sx={{ mr: 1 }} />
                    <Typography variant="h6">Documents</Typography>
                  </Box>
                  {canEditApplication && (
                    <IconButton size="small" color="primary">
                      <Upload />
                    </IconButton>
                  )}
                </Box>
                <Divider sx={{ mb: 2 }} />
                {application.documents && application.documents.length > 0 ? (
                  <List>
                    {application.documents.map((doc: any, index: number) => (
                      <ListItem key={index} secondaryAction={
                        <IconButton edge="end" aria-label="download">
                          <Download />
                        </IconButton>
                      }>
                        <ListItemIcon>
                          <Assignment />
                        </ListItemIcon>
                        <ListItemText
                          primary={doc.name || `Document ${index + 1}`}
                          secondary={doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : 'No date'}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No documents uploaded
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Notes */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Notes sx={{ mr: 1 }} />
                    <Typography variant="h6">Notes</Typography>
                  </Box>
                  {canEditApplication && (
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => {
                        setNewNotes('');
                        setNotesDialog(true);
                      }}
                    >
                      <Edit />
                    </IconButton>
                  )}
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {application.notes || 'No notes added'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Status Change Dialog */}
          <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              {newStatus === 'ACCEPTED' ? 'Accept Application' : 'Reject Application'}
            </DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Reason/Notes"
                multiline
                rows={4}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                sx={{ mt: 2 }}
                placeholder={`Please provide a reason for ${newStatus === 'ACCEPTED' ? 'accepting' : 'rejecting'} this application...`}
              />
            </DialogContent>
            <DialogActions>
              <Button variant="text" onClick={() => setStatusDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color={newStatus === 'ACCEPTED' ? 'success' : 'error'}
                onClick={handleStatusChange}
                disabled={updateStatusMutation.isPending}
              >
                Confirm {newStatus === 'ACCEPTED' ? 'Acceptance' : 'Rejection'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Notes Dialog */}
          <Dialog open={notesDialog} onClose={() => setNotesDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Add Notes</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="New Notes"
                multiline
                rows={4}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                sx={{ mt: 2 }}
                placeholder="Enter additional notes about this application..."
              />
            </DialogContent>
            <DialogActions>
              <Button variant="text" onClick={() => setNotesDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleNotesUpdate}
                disabled={updateNotesMutation.isPending || !newNotes}
              >
                Add Notes
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : null}
    </Box>
  );
};

export default ApplicationDetails;