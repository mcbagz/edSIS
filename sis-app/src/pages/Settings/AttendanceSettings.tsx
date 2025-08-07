import React, { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
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
import { Plus, Save, Clock, Bell, AlertCircle, Trash2, CheckCircle } from 'lucide-react';

interface AttendanceSettingsProps {
  onSettingsChange: () => void;
}

interface AttendanceCode {
  id: string;
  code: string;
  description: string;
  category: 'present' | 'absent' | 'tardy' | 'excused' | 'unexcused';
  shortcut?: string;
  isActive: boolean;
  countsTowardAbsence: boolean;
}

export default function AttendanceSettings({ onSettingsChange }: AttendanceSettingsProps) {
  const [attendanceCodes, setAttendanceCodes] = useState<AttendanceCode[]>([
    { id: '1', code: 'P', description: 'Present', category: 'present', shortcut: '1', isActive: true, countsTowardAbsence: false },
    { id: '2', code: 'A', description: 'Absent', category: 'absent', shortcut: '2', isActive: true, countsTowardAbsence: true },
    { id: '3', code: 'T', description: 'Tardy', category: 'tardy', shortcut: '3', isActive: true, countsTowardAbsence: false },
    { id: '4', code: 'EA', description: 'Excused Absence', category: 'excused', shortcut: '4', isActive: true, countsTowardAbsence: true },
    { id: '5', code: 'UA', description: 'Unexcused Absence', category: 'unexcused', shortcut: '5', isActive: true, countsTowardAbsence: true },
    { id: '6', code: 'FT', description: 'Field Trip', category: 'excused', shortcut: '6', isActive: true, countsTowardAbsence: false },
    { id: '7', code: 'ISS', description: 'In-School Suspension', category: 'present', shortcut: '7', isActive: true, countsTowardAbsence: false },
    { id: '8', code: 'OSS', description: 'Out-of-School Suspension', category: 'absent', shortcut: '8', isActive: true, countsTowardAbsence: true },
  ]);

  const [notificationSettings, setNotificationSettings] = useState({
    enableNotifications: true,
    notifyOnAbsence: true,
    notifyOnTardy: true,
    notifyOnExcessive: true,
    excessiveAbsenceThreshold: 5,
    excessiveTardyThreshold: 10,
    notificationMethod: 'email', // email, sms, both
    notificationTime: '09:00',
    sendDailySummary: false,
    summaryTime: '15:00',
  });

  const [policies, setPolicies] = useState({
    defaultAttendanceCode: 'P',
    allowTeacherOverride: true,
    requireComments: false,
    lockAttendanceAfterDays: 7,
    minimumAttendancePercent: 90,
    tardyCountsAsPartialAbsence: false,
    tardiesEqualOneAbsence: 3,
    autoMarkPresentFromCardSwipe: false,
    allowParentExcuse: true,
    maxParentExcusesPerYear: 10,
  });

  const [newCode, setNewCode] = useState<Partial<AttendanceCode>>({
    code: '',
    description: '',
    category: 'present',
    shortcut: '',
    isActive: true,
    countsTowardAbsence: false,
  });
  const [showCodeForm, setShowCodeForm] = useState(false);

  const handleAddCode = () => {
    if (!newCode.code || !newCode.description) {
      toast({
        title: 'Error',
        description: 'Please provide code and description',
        variant: 'destructive',
      });
      return;
    }

    const code: AttendanceCode = {
      id: Date.now().toString(),
      code: newCode.code!,
      description: newCode.description!,
      category: newCode.category!,
      shortcut: newCode.shortcut,
      isActive: newCode.isActive!,
      countsTowardAbsence: newCode.countsTowardAbsence!,
    };

    setAttendanceCodes(prev => [...prev, code]);
    setNewCode({
      code: '',
      description: '',
      category: 'present',
      shortcut: '',
      isActive: true,
      countsTowardAbsence: false,
    });
    setShowCodeForm(false);
    onSettingsChange();

    toast({
      title: 'Success',
      description: 'Attendance code added successfully',
    });
  };

  const handleToggleCode = (id: string) => {
    setAttendanceCodes(prev => prev.map(code => 
      code.id === id ? { ...code, isActive: !code.isActive } : code
    ));
    onSettingsChange();
  };

  const handleDeleteCode = (id: string) => {
    setAttendanceCodes(prev => prev.filter(code => code.id !== id));
    onSettingsChange();
    
    toast({
      title: 'Success',
      description: 'Attendance code deleted',
    });
  };

  const handleNotificationChange = (field: string, value: any) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
    onSettingsChange();
  };

  const handlePolicyChange = (field: string, value: any) => {
    setPolicies(prev => ({ ...prev, [field]: value }));
    onSettingsChange();
  };

  const getCategoryBadgeVariant = (category: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      present: 'default',
      absent: 'destructive',
      tardy: 'secondary',
      excused: 'outline',
      unexcused: 'destructive',
    };
    return variants[category] || 'default';
  };

  const handleSave = () => {
    toast({
      title: 'Success',
      description: 'Attendance settings saved successfully',
    });
  };

  return (
    <div className="space-y-6">
      {/* Attendance Codes */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Attendance Codes
              </CardTitle>
              <CardDescription>
                Configure attendance codes and their behaviors
              </CardDescription>
            </div>
            <Button onClick={() => setShowCodeForm(!showCodeForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Code
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showCodeForm && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="codeValue">Code</Label>
                  <Input
                    id="codeValue"
                    placeholder="e.g., ET"
                    value={newCode.code}
                    onChange={(e) => setNewCode({ ...newCode, code: e.target.value })}
                    maxLength={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="codeDesc">Description</Label>
                  <Input
                    id="codeDesc"
                    placeholder="e.g., Early Dismissal"
                    value={newCode.description}
                    onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="codeCategory">Category</Label>
                  <Select 
                    value={newCode.category} 
                    onValueChange={(value: any) => setNewCode({ ...newCode, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="tardy">Tardy</SelectItem>
                      <SelectItem value="excused">Excused</SelectItem>
                      <SelectItem value="unexcused">Unexcused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="codeShortcut">Shortcut</Label>
                  <Input
                    id="codeShortcut"
                    placeholder="e.g., 9"
                    value={newCode.shortcut}
                    onChange={(e) => setNewCode({ ...newCode, shortcut: e.target.value })}
                    maxLength={1}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleAddCode}>Add</Button>
                  <Button variant="outline" onClick={() => setShowCodeForm(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Shortcut</TableHead>
                <TableHead>Counts as Absence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="font-mono font-bold">{code.code}</TableCell>
                  <TableCell>{code.description}</TableCell>
                  <TableCell>
                    <Badge variant={getCategoryBadgeVariant(code.category)}>
                      {code.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{code.shortcut || '-'}</TableCell>
                  <TableCell>
                    {code.countsTowardAbsence ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={code.isActive}
                      onCheckedChange={() => handleToggleCode(code.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCode(code.id)}
                      disabled={['1', '2', '3'].includes(code.id)} // Prevent deleting core codes
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure automatic attendance notifications to parents/guardians
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableNotifications">Enable Notifications</Label>
              <p className="text-sm text-gray-500">Send automatic notifications for attendance events</p>
            </div>
            <Switch
              id="enableNotifications"
              checked={notificationSettings.enableNotifications}
              onCheckedChange={(checked) => handleNotificationChange('enableNotifications', checked)}
            />
          </div>

          {notificationSettings.enableNotifications && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifyAbsence">Notify on Absence</Label>
                  <Switch
                    id="notifyAbsence"
                    checked={notificationSettings.notifyOnAbsence}
                    onCheckedChange={(checked) => handleNotificationChange('notifyOnAbsence', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="notifyTardy">Notify on Tardy</Label>
                  <Switch
                    id="notifyTardy"
                    checked={notificationSettings.notifyOnTardy}
                    onCheckedChange={(checked) => handleNotificationChange('notifyOnTardy', checked)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="excessiveAbsence">Excessive Absence Threshold</Label>
                  <Input
                    id="excessiveAbsence"
                    type="number"
                    value={notificationSettings.excessiveAbsenceThreshold}
                    onChange={(e) => handleNotificationChange('excessiveAbsenceThreshold', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-gray-500 mt-1">Notify when absences exceed this number</p>
                </div>

                <div>
                  <Label htmlFor="excessiveTardy">Excessive Tardy Threshold</Label>
                  <Input
                    id="excessiveTardy"
                    type="number"
                    value={notificationSettings.excessiveTardyThreshold}
                    onChange={(e) => handleNotificationChange('excessiveTardyThreshold', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-gray-500 mt-1">Notify when tardies exceed this number</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notificationMethod">Notification Method</Label>
                  <Select 
                    value={notificationSettings.notificationMethod} 
                    onValueChange={(value) => handleNotificationChange('notificationMethod', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email Only</SelectItem>
                      <SelectItem value="sms">SMS Only</SelectItem>
                      <SelectItem value="both">Email & SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notificationTime">Notification Time</Label>
                  <Input
                    id="notificationTime"
                    type="time"
                    value={notificationSettings.notificationTime}
                    onChange={(e) => handleNotificationChange('notificationTime', e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Attendance Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Attendance Policies
          </CardTitle>
          <CardDescription>
            School-wide attendance policies and rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultCode">Default Attendance Code</Label>
              <Select 
                value={policies.defaultAttendanceCode} 
                onValueChange={(value) => handlePolicyChange('defaultAttendanceCode', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {attendanceCodes.filter(c => c.isActive).map(code => (
                    <SelectItem key={code.id} value={code.code}>
                      {code.code} - {code.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="lockDays">Lock Attendance After (days)</Label>
              <Input
                id="lockDays"
                type="number"
                value={policies.lockAttendanceAfterDays}
                onChange={(e) => handlePolicyChange('lockAttendanceAfterDays', parseInt(e.target.value))}
              />
              <p className="text-sm text-gray-500 mt-1">Days after which attendance cannot be edited</p>
            </div>

            <div>
              <Label htmlFor="minAttendance">Minimum Attendance %</Label>
              <Input
                id="minAttendance"
                type="number"
                value={policies.minimumAttendancePercent}
                onChange={(e) => handlePolicyChange('minimumAttendancePercent', parseInt(e.target.value))}
              />
              <p className="text-sm text-gray-500 mt-1">Required attendance percentage for promotion</p>
            </div>

            <div>
              <Label htmlFor="tardiesAbsence">Tardies Equal One Absence</Label>
              <Input
                id="tardiesAbsence"
                type="number"
                value={policies.tardiesEqualOneAbsence}
                onChange={(e) => handlePolicyChange('tardiesEqualOneAbsence', parseInt(e.target.value))}
              />
              <p className="text-sm text-gray-500 mt-1">Number of tardies that count as one absence</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="teacherOverride">Allow Teacher Override</Label>
                <p className="text-sm text-gray-500">Teachers can modify attendance after submission</p>
              </div>
              <Switch
                id="teacherOverride"
                checked={policies.allowTeacherOverride}
                onCheckedChange={(checked) => handlePolicyChange('allowTeacherOverride', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requireComments">Require Comments</Label>
                <p className="text-sm text-gray-500">Require comments for certain attendance codes</p>
              </div>
              <Switch
                id="requireComments"
                checked={policies.requireComments}
                onCheckedChange={(checked) => handlePolicyChange('requireComments', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="parentExcuse">Allow Parent Excuse</Label>
                <p className="text-sm text-gray-500">Parents can excuse absences through the portal</p>
              </div>
              <Switch
                id="parentExcuse"
                checked={policies.allowParentExcuse}
                onCheckedChange={(checked) => handlePolicyChange('allowParentExcuse', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Attendance Settings
        </Button>
      </div>
    </div>
  );
}