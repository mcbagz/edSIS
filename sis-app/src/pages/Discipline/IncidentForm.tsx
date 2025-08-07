import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, Trash2, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { disciplineService } from '@/services/disciplineService';
import type {
  DisciplineIncident,
  BehaviorCode,
  ActionType,
} from '@/services/disciplineService';
import { studentService } from '@/services/studentService';

interface StudentIncidentForm {
  studentId: string;
  studentRole: string;
}

interface DisciplineActionForm {
  actionType: string;
  actionDate: string;
  duration?: string;
  description?: string;
  assignedBy: string;
}

export default function IncidentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [behaviorCodes, setBehaviorCodes] = useState<BehaviorCode[]>([]);
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Form fields
  const [incidentDate, setIncidentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [incidentTime, setIncidentTime] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterDescription, setReporterDescription] = useState('');
  const [behaviorCode, setBehaviorCode] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [studentIncidents, setStudentIncidents] = useState<StudentIncidentForm[]>([]);
  const [disciplineActions, setDisciplineActions] = useState<DisciplineActionForm[]>([]);

  useEffect(() => {
    loadReferenceData();
    loadStudents();
    if (isEdit) {
      loadIncident();
    }
  }, [id]);

  const loadReferenceData = async () => {
    try {
      const [codes, types] = await Promise.all([
        disciplineService.getBehaviorCodes(),
        disciplineService.getActionTypes(),
      ]);
      setBehaviorCodes(codes);
      setActionTypes(types);
    } catch (error) {
      console.error('Error loading reference data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reference data',
        variant: 'destructive',
      });
    }
  };

  const loadStudents = async () => {
    try {
      const response = await studentService.getStudents();
      setStudents(response);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadIncident = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const incident = await disciplineService.getIncidentById(id);
      
      setIncidentDate(format(new Date(incident.incidentDate), 'yyyy-MM-dd'));
      setIncidentTime(incident.incidentTime || '');
      setIncidentLocation(incident.incidentLocation || '');
      setReporterName(incident.reporterName || '');
      setReporterDescription(incident.reporterDescription || '');
      setBehaviorCode(incident.behaviorCode);
      setIncidentDescription(incident.incidentDescription);
      
      setStudentIncidents(
        incident.studentIncidents?.map((si: any) => ({
          studentId: si.studentId,
          studentRole: si.studentRole,
        })) || []
      );
      
      setDisciplineActions(
        incident.disciplineActions?.map((action: any) => ({
          actionType: action.actionType,
          actionDate: format(new Date(action.actionDate), 'yyyy-MM-dd'),
          duration: action.duration || '',
          description: action.description || '',
          assignedBy: action.assignedBy,
        })) || []
      );
    } catch (error) {
      console.error('Error loading incident:', error);
      toast({
        title: 'Error',
        description: 'Failed to load incident',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!behaviorCode) {
      toast({
        title: 'Error',
        description: 'Please select a behavior code',
        variant: 'destructive',
      });
      return;
    }

    if (!incidentDescription) {
      toast({
        title: 'Error',
        description: 'Please provide an incident description',
        variant: 'destructive',
      });
      return;
    }

    if (studentIncidents.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one student to the incident',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const incidentData: any = {
        incidentDate,
        incidentTime,
        incidentLocation,
        reporterName,
        reporterDescription,
        behaviorCode,
        incidentDescription,
        studentIncidents,
        disciplineActions,
      };

      if (isEdit) {
        await disciplineService.updateIncident(id!, incidentData);
        toast({
          title: 'Success',
          description: 'Incident updated successfully',
        });
      } else {
        await disciplineService.createIncident(incidentData);
        toast({
          title: 'Success',
          description: 'Incident created successfully',
        });
      }

      navigate('/discipline');
    } catch (error) {
      console.error('Error saving incident:', error);
      toast({
        title: 'Error',
        description: 'Failed to save incident',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addStudent = () => {
    setStudentIncidents([...studentIncidents, { studentId: '', studentRole: 'Perpetrator' }]);
  };

  const updateStudent = (index: number, field: keyof StudentIncidentForm, value: string) => {
    const updated = [...studentIncidents];
    updated[index] = { ...updated[index], [field]: value };
    setStudentIncidents(updated);
  };

  const removeStudent = (index: number) => {
    setStudentIncidents(studentIncidents.filter((_, i) => i !== index));
  };

  const addAction = () => {
    setDisciplineActions([
      ...disciplineActions,
      {
        actionType: '',
        actionDate: format(new Date(), 'yyyy-MM-dd'),
        duration: '',
        description: '',
        assignedBy: '',
      },
    ]);
  };

  const updateAction = (index: number, field: keyof DisciplineActionForm, value: string) => {
    const updated = [...disciplineActions];
    updated[index] = { ...updated[index], [field]: value };
    setDisciplineActions(updated);
  };

  const removeAction = (index: number) => {
    setDisciplineActions(disciplineActions.filter((_, i) => i !== index));
  };

  const filteredStudents = students.filter((student) => {
    const search = studentSearch.toLowerCase();
    return (
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(search) ||
      student.studentUniqueId.toLowerCase().includes(search)
    );
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/discipline')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Discipline Management
        </Button>
        <h1 className="text-3xl font-bold">
          {isEdit ? 'Edit Incident' : 'New Discipline Incident'}
        </h1>
        <p className="text-gray-600">
          {isEdit ? 'Update discipline incident details' : 'Record a new discipline incident'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Incident Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Incident Details</CardTitle>
            <CardDescription>Basic information about the incident</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="incidentDate">Incident Date *</Label>
              <Input
                id="incidentDate"
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="incidentTime">Incident Time</Label>
              <Input
                id="incidentTime"
                type="time"
                value={incidentTime}
                onChange={(e) => setIncidentTime(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="incidentLocation">Location</Label>
              <Input
                id="incidentLocation"
                placeholder="e.g., Cafeteria, Hallway, Classroom 201"
                value={incidentLocation}
                onChange={(e) => setIncidentLocation(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="behaviorCode">Behavior Code *</Label>
              <Select value={behaviorCode} onValueChange={setBehaviorCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select behavior code" />
                </SelectTrigger>
                <SelectContent>
                  {behaviorCodes.map((code) => (
                    <SelectItem key={code.code} value={code.code}>
                      {code.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reporterName">Reporter Name</Label>
              <Input
                id="reporterName"
                placeholder="Name of person reporting the incident"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="reporterDescription">Reporter Title/Role</Label>
              <Input
                id="reporterDescription"
                placeholder="e.g., Teacher, Administrator, Security"
                value={reporterDescription}
                onChange={(e) => setReporterDescription(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="incidentDescription">Incident Description *</Label>
              <Textarea
                id="incidentDescription"
                rows={4}
                placeholder="Provide a detailed description of the incident..."
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Students Involved */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Students Involved</CardTitle>
                <CardDescription>Add students involved in the incident</CardDescription>
              </div>
              <Button type="button" onClick={addStudent} size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {studentIncidents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No students added. Click "Add Student" to add students to this incident.
              </p>
            ) : (
              <div className="space-y-4">
                {studentIncidents.map((si, index) => (
                  <div key={index} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label>Student</Label>
                      <Select
                        value={si.studentId}
                        onValueChange={(value) => updateStudent(index, 'studentId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2">
                            <Input
                              placeholder="Search students..."
                              value={studentSearch}
                              onChange={(e) => setStudentSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {filteredStudents.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.firstName} {student.lastName} ({student.studentUniqueId})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-48">
                      <Label>Role</Label>
                      <Select
                        value={si.studentRole}
                        onValueChange={(value) => updateStudent(index, 'studentRole', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Perpetrator">Perpetrator</SelectItem>
                          <SelectItem value="Victim">Victim</SelectItem>
                          <SelectItem value="Witness">Witness</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeStudent(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Disciplinary Actions */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Disciplinary Actions</CardTitle>
                <CardDescription>Actions taken in response to the incident</CardDescription>
              </div>
              <Button type="button" onClick={addAction} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Action
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {disciplineActions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No actions added. You can add disciplinary actions later if needed.
              </p>
            ) : (
              <div className="space-y-4">
                {disciplineActions.map((action, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Action {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeAction(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Action Type</Label>
                        <Select
                          value={action.actionType}
                          onValueChange={(value) => updateAction(index, 'actionType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select action type" />
                          </SelectTrigger>
                          <SelectContent>
                            {actionTypes.map((type) => (
                              <SelectItem key={type.type} value={type.type}>
                                {type.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Action Date</Label>
                        <Input
                          type="date"
                          value={action.actionDate}
                          onChange={(e) => updateAction(index, 'actionDate', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Duration</Label>
                        <Input
                          placeholder="e.g., 3 days, 1 week"
                          value={action.duration}
                          onChange={(e) => updateAction(index, 'duration', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Assigned By</Label>
                        <Input
                          placeholder="Name of person assigning action"
                          value={action.assignedBy}
                          onChange={(e) => updateAction(index, 'assignedBy', e.target.value)}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          rows={2}
                          placeholder="Additional details about the action..."
                          value={action.description}
                          onChange={(e) => updateAction(index, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/discipline')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Incident' : 'Create Incident'}
          </Button>
        </div>
      </form>
    </div>
  );
}