import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Save, 
  Calendar, 
  Clock, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle 
} from 'lucide-react';
import { format } from 'date-fns';
import { API_BASE_URL } from '@/config';

interface AcademicSettingsProps {
  onSettingsChange: () => void;
}

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface GradingPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  academicYearId: string;
}

export default function AcademicSettings({ onSettingsChange }: AcademicSettingsProps) {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [gradingPeriods, setGradingPeriods] = useState<GradingPeriod[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showYearForm, setShowYearForm] = useState(false);
  const [showPeriodForm, setShowPeriodForm] = useState(false);
  
  const [yearForm, setYearForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isActive: false
  });
  
  const [periodForm, setPeriodForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    academicYearId: ''
  });

  useEffect(() => {
    loadAcademicData();
  }, []);

  const loadAcademicData = async () => {
    // Load sample data
    const sampleYears: AcademicYear[] = [
      {
        id: '1',
        name: '2024-2025',
        startDate: '2024-08-15',
        endDate: '2025-06-15',
        isActive: true
      },
      {
        id: '2',
        name: '2023-2024',
        startDate: '2023-08-15',
        endDate: '2024-06-15',
        isActive: false
      }
    ];
    
    const samplePeriods: GradingPeriod[] = [
      {
        id: '1',
        name: 'Quarter 1',
        startDate: '2024-08-15',
        endDate: '2024-10-31',
        academicYearId: '1'
      },
      {
        id: '2',
        name: 'Quarter 2',
        startDate: '2024-11-01',
        endDate: '2025-01-31',
        academicYearId: '1'
      },
      {
        id: '3',
        name: 'Quarter 3',
        startDate: '2025-02-01',
        endDate: '2025-04-15',
        academicYearId: '1'
      },
      {
        id: '4',
        name: 'Quarter 4',
        startDate: '2025-04-16',
        endDate: '2025-06-15',
        academicYearId: '1'
      }
    ];
    
    setAcademicYears(sampleYears);
    setGradingPeriods(samplePeriods);
    setSelectedYear(sampleYears.find(y => y.isActive)?.id || '1');
  };

  const handleAddYear = () => {
    const newYear: AcademicYear = {
      id: Date.now().toString(),
      ...yearForm
    };
    
    // If setting as active, deactivate others
    if (newYear.isActive) {
      setAcademicYears(prev => prev.map(y => ({ ...y, isActive: false })));
    }
    
    setAcademicYears(prev => [...prev, newYear]);
    setShowYearForm(false);
    setYearForm({ name: '', startDate: '', endDate: '', isActive: false });
    onSettingsChange();
    
    toast({
      title: 'Success',
      description: 'Academic year added successfully',
    });
  };

  const handleAddPeriod = () => {
    const newPeriod: GradingPeriod = {
      id: Date.now().toString(),
      ...periodForm,
      academicYearId: selectedYear
    };
    
    setGradingPeriods(prev => [...prev, newPeriod]);
    setShowPeriodForm(false);
    setPeriodForm({ name: '', startDate: '', endDate: '', academicYearId: '' });
    onSettingsChange();
    
    toast({
      title: 'Success',
      description: 'Grading period added successfully',
    });
  };

  const handleSetActive = (yearId: string) => {
    setAcademicYears(prev => prev.map(y => ({
      ...y,
      isActive: y.id === yearId
    })));
    onSettingsChange();
    
    toast({
      title: 'Success',
      description: 'Active academic year updated',
    });
  };

  const handleDeleteYear = (yearId: string) => {
    setAcademicYears(prev => prev.filter(y => y.id !== yearId));
    setGradingPeriods(prev => prev.filter(p => p.academicYearId !== yearId));
    onSettingsChange();
    
    toast({
      title: 'Success',
      description: 'Academic year deleted',
    });
  };

  const handleDeletePeriod = (periodId: string) => {
    setGradingPeriods(prev => prev.filter(p => p.id !== periodId));
    onSettingsChange();
    
    toast({
      title: 'Success',
      description: 'Grading period deleted',
    });
  };

  const filteredPeriods = gradingPeriods.filter(p => p.academicYearId === selectedYear);

  return (
    <div className="space-y-6">
      {/* Academic Years */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Academic Years
              </CardTitle>
              <CardDescription>
                Manage academic years and school terms
              </CardDescription>
            </div>
            <Button onClick={() => setShowYearForm(!showYearForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Year
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showYearForm && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="yearName">Year Name</Label>
                  <Input
                    id="yearName"
                    placeholder="e.g., 2025-2026"
                    value={yearForm.name}
                    onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="yearStart">Start Date</Label>
                  <Input
                    id="yearStart"
                    type="date"
                    value={yearForm.startDate}
                    onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="yearEnd">End Date</Label>
                  <Input
                    id="yearEnd"
                    type="date"
                    value={yearForm.endDate}
                    onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleAddYear}>Add</Button>
                  <Button variant="outline" onClick={() => setShowYearForm(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Academic Year</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {academicYears.map((year) => (
                <TableRow key={year.id}>
                  <TableCell className="font-medium">{year.name}</TableCell>
                  <TableCell>{format(new Date(year.startDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{format(new Date(year.endDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    {year.isActive ? (
                      <Badge variant="default">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {!year.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetActive(year.id)}
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteYear(year.id)}
                        disabled={year.isActive}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Grading Periods */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Grading Periods
              </CardTitle>
              <CardDescription>
                Configure quarters, semesters, or other grading periods
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setShowPeriodForm(!showPeriodForm)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Period
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showPeriodForm && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="periodName">Period Name</Label>
                  <Input
                    id="periodName"
                    placeholder="e.g., Quarter 1"
                    value={periodForm.name}
                    onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="periodStart">Start Date</Label>
                  <Input
                    id="periodStart"
                    type="date"
                    value={periodForm.startDate}
                    onChange={(e) => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="periodEnd">End Date</Label>
                  <Input
                    id="periodEnd"
                    type="date"
                    value={periodForm.endDate}
                    onChange={(e) => setPeriodForm({ ...periodForm, endDate: e.target.value })}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleAddPeriod}>Add</Button>
                  <Button variant="outline" onClick={() => setShowPeriodForm(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPeriods.map((period) => {
                const start = new Date(period.startDate);
                const end = new Date(period.endDate);
                const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                const weeks = Math.ceil(days / 7);
                
                return (
                  <TableRow key={period.id}>
                    <TableCell className="font-medium">{period.name}</TableCell>
                    <TableCell>{format(start, 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(end, 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{weeks} weeks ({days} days)</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePeriod(period.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}