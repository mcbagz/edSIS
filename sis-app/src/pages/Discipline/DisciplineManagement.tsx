import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
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
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  IconButton,
  Box,
  Grid,
  InputAdornment,
} from '@mui/material';
import { useToast } from '@/components/molecules';
import {
  Add as PlusIcon,
  Edit as EditIcon,
  Delete as Trash2Icon,
  Visibility as EyeIcon,
  Description as FileTextIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { disciplineService } from '@/services/disciplineService';
import type { DisciplineIncident, BehaviorCode } from '@/services/disciplineService';

type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

export default function DisciplineManagement() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<DisciplineIncident[]>([]);
  const [behaviorCodes, setBehaviorCodes] = useState<BehaviorCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBehaviorCode, setSelectedBehaviorCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadIncidents();
    loadBehaviorCodes();
  }, [currentPage, selectedBehaviorCode, startDate, endDate]);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const response = await disciplineService.getIncidents({
        behaviorCode: selectedBehaviorCode || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        limit: 20,
      });
      
      setIncidents(response.incidents);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error loading incidents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load discipline incidents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBehaviorCodes = async () => {
    try {
      const codes = await disciplineService.getBehaviorCodes();
      setBehaviorCodes(codes);
    } catch (error) {
      console.error('Error loading behavior codes:', error);
    }
  };

  const handleDelete = async () => {
    if (!incidentToDelete) return;

    try {
      await disciplineService.deleteIncident(incidentToDelete);
      toast({
        title: 'Success',
        description: 'Incident deleted successfully',
      });
      loadIncidents();
    } catch (error) {
      console.error('Error deleting incident:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete incident',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setIncidentToDelete(null);
    }
  };

  const confirmDelete = (id: string) => {
    setIncidentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const getBehaviorCodeBadgeVariant = (code: string) => {
    const severityMap: Record<string, 'destructive' | 'secondary' | 'default'> = {
      'FIGHTING': 'destructive',
      'BULLYING': 'destructive',
      'WEAPON': 'destructive',
      'SUBSTANCE': 'destructive',
      'THEFT': 'destructive',
      'VANDALISM': 'destructive',
      'DISRUPTION': 'secondary',
      'DISRESPECT': 'secondary',
      'CHEATING': 'secondary',
      'TARDY': 'default',
      'ABSENCE': 'default',
      'DRESS_CODE': 'default',
      'TECHNOLOGY': 'default',
    };
    return severityMap[code] || 'default';
  };

  const getActionBadgeVariant = (actionType: string) => {
    const severityMap: Record<string, 'destructive' | 'secondary' | 'default'> = {
      'EXPULSION': 'destructive',
      'OUT_SCHOOL_SUSPENSION': 'destructive',
      'IN_SCHOOL_SUSPENSION': 'secondary',
      'DETENTION': 'secondary',
      'WARNING': 'default',
      'COUNSELING': 'default',
      'PARENT_CONFERENCE': 'default',
    };
    return severityMap[actionType] || 'default';
  };

  const filteredIncidents = incidents.filter(incident => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesStudent = incident.studentIncidents?.some(si => 
        si.student && (
          `${si.student.firstName} ${si.student.lastName}`.toLowerCase().includes(search) ||
          si.student.studentUniqueId.toLowerCase().includes(search)
        )
      );
      const matchesDescription = incident.incidentDescription.toLowerCase().includes(search);
      const matchesLocation = incident.incidentLocation?.toLowerCase().includes(search);
      
      if (!matchesStudent && !matchesDescription && !matchesLocation) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Discipline Management</h1>
        <p className="text-gray-600">Track and manage student discipline incidents</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Discipline Incidents</CardTitle>
              <CardDescription>View and manage all discipline incidents</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/discipline/report')}
                variant="outline"
              >
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
              <Button
                onClick={() => navigate('/discipline/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Incident
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search incidents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="behaviorCode">Behavior Code</Label>
              <Select value={selectedBehaviorCode} onValueChange={setSelectedBehaviorCode}>
                <SelectTrigger>
                  <SelectValue placeholder="All behaviors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All behaviors</SelectItem>
                  {behaviorCodes.map((code) => (
                    <SelectItem key={code.code} value={code.code}>
                      {code.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Incidents Table */}
          {loading ? (
            <div className="text-center py-8">Loading incidents...</div>
          ) : filteredIncidents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No incidents found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Incident ID</TableHead>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Student(s)</TableHead>
                    <TableHead>Behavior</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Action Taken</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="font-medium">
                        {incident.incidentIdentifier}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{format(new Date(incident.incidentDate), 'MMM dd, yyyy')}</div>
                          {incident.incidentTime && (
                            <div className="text-sm text-gray-500">{incident.incidentTime}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {incident.studentIncidents?.map((si, idx) => (
                          <div key={si.id}>
                            {si.student && (
                              <div className="flex items-center gap-2">
                                <span>{si.student.firstName} {si.student.lastName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {si.studentRole}
                                </Badge>
                              </div>
                            )}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getBehaviorCodeBadgeVariant(incident.behaviorCode)}>
                          {behaviorCodes.find(c => c.code === incident.behaviorCode)?.description || incident.behaviorCode}
                        </Badge>
                      </TableCell>
                      <TableCell>{incident.incidentLocation || '-'}</TableCell>
                      <TableCell>
                        {incident.disciplineActions && incident.disciplineActions.length > 0 ? (
                          <div className="space-y-1">
                            {incident.disciplineActions.slice(0, 2).map((action, idx) => (
                              <Badge key={idx} variant={getActionBadgeVariant(action.actionType)}>
                                {action.actionType.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                            {incident.disciplineActions.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{incident.disciplineActions.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/discipline/${incident.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/discipline/${incident.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => confirmDelete(incident.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this discipline incident and all associated records.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}