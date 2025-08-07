import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import {
  School,
  Calendar,
  Award,
  Clock,
  Bell,
  Settings as SettingsIcon,
  Save,
} from 'lucide-react';
import SchoolSettings from './SchoolSettings';
import AcademicSettings from './AcademicSettings';
import GradingSettings from './GradingSettings';
import AttendanceSettings from './AttendanceSettings';
import SystemSettings from './SystemSettings';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('school');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSaveAll = async () => {
    try {
      // Save all settings across tabs
      toast({
        title: 'Success',
        description: 'All settings have been saved successfully',
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">System Settings</h1>
            <p className="text-gray-600">Configure system-wide settings and preferences</p>
          </div>
          {hasUnsavedChanges && (
            <Button onClick={handleSaveAll}>
              <Save className="mr-2 h-4 w-4" />
              Save All Changes
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="school" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            School
          </TabsTrigger>
          <TabsTrigger value="academic" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Academic
          </TabsTrigger>
          <TabsTrigger value="grading" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Grading
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="school">
          <SchoolSettings onSettingsChange={() => setHasUnsavedChanges(true)} />
        </TabsContent>

        <TabsContent value="academic">
          <AcademicSettings onSettingsChange={() => setHasUnsavedChanges(true)} />
        </TabsContent>

        <TabsContent value="grading">
          <GradingSettings onSettingsChange={() => setHasUnsavedChanges(true)} />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceSettings onSettingsChange={() => setHasUnsavedChanges(true)} />
        </TabsContent>

        <TabsContent value="system">
          <SystemSettings onSettingsChange={() => setHasUnsavedChanges(true)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}