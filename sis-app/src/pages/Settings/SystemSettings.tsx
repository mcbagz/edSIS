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
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { 
  Save, 
  Settings, 
  Shield, 
  Database, 
  Globe, 
  Clock,
  Mail,
  Lock,
  AlertCircle 
} from 'lucide-react';

interface SystemSettingsProps {
  onSettingsChange: () => void;
}

export default function SystemSettings({ onSettingsChange }: SystemSettingsProps) {
  const [generalSettings, setGeneralSettings] = useState({
    systemName: 'Student Information System',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour',
    language: 'en-US',
    currency: 'USD',
    fiscalYearStart: '07-01',
    maintenanceMode: false,
    maintenanceMessage: '',
  });

  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    passwordExpireDays: 90,
    sessionTimeout: 30, // minutes
    maxLoginAttempts: 5,
    lockoutDuration: 30, // minutes
    twoFactorEnabled: false,
    twoFactorMethod: 'email', // email, sms, app
    enforceIPWhitelist: false,
    ipWhitelist: '',
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: true,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'noreply@school.edu',
    fromName: 'School SIS',
    emailFooter: '',
    testEmailAddress: '',
  });

  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily', // daily, weekly, monthly
    backupTime: '02:00',
    backupRetentionDays: 30,
    backupLocation: 'local', // local, cloud
    cloudProvider: '',
    cloudBucket: '',
    lastBackup: '2024-01-15 02:00:00',
  });

  const [integrationSettings, setIntegrationSettings] = useState({
    edfiEnabled: false,
    edfiApiUrl: '',
    edfiApiKey: '',
    edfiApiSecret: '',
    googleClassroomEnabled: false,
    googleClientId: '',
    googleClientSecret: '',
    canvasEnabled: false,
    canvasApiUrl: '',
    canvasApiToken: '',
  });

  const handleGeneralChange = (field: string, value: any) => {
    setGeneralSettings(prev => ({ ...prev, [field]: value }));
    onSettingsChange();
  };

  const handleSecurityChange = (field: string, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }));
    onSettingsChange();
  };

  const handleEmailChange = (field: string, value: any) => {
    setEmailSettings(prev => ({ ...prev, [field]: value }));
    onSettingsChange();
  };

  const handleBackupChange = (field: string, value: any) => {
    setBackupSettings(prev => ({ ...prev, [field]: value }));
    onSettingsChange();
  };

  const handleIntegrationChange = (field: string, value: any) => {
    setIntegrationSettings(prev => ({ ...prev, [field]: value }));
    onSettingsChange();
  };

  const testEmailConnection = async () => {
    if (!emailSettings.testEmailAddress) {
      toast({
        title: 'Error',
        description: 'Please enter a test email address',
        variant: 'destructive',
      });
      return;
    }

    // Simulate email test
    toast({
      title: 'Email Sent',
      description: `Test email sent to ${emailSettings.testEmailAddress}`,
    });
  };

  const runBackupNow = async () => {
    toast({
      title: 'Backup Started',
      description: 'Database backup has been initiated',
    });
    
    // Simulate backup completion
    setTimeout(() => {
      setBackupSettings(prev => ({
        ...prev,
        lastBackup: new Date().toISOString().replace('T', ' ').slice(0, -5)
      }));
      toast({
        title: 'Backup Complete',
        description: 'Database backup completed successfully',
      });
    }, 3000);
  };

  const handleSave = () => {
    toast({
      title: 'Success',
      description: 'System settings saved successfully',
    });
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Basic system configuration and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="systemName">System Name</Label>
            <Input
              id="systemName"
              value={generalSettings.systemName}
              onChange={(e) => handleGeneralChange('systemName', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select 
              value={generalSettings.timezone} 
              onValueChange={(value) => handleGeneralChange('timezone', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="America/Phoenix">Arizona Time</SelectItem>
                <SelectItem value="Pacific/Honolulu">Hawaii Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select 
              value={generalSettings.dateFormat} 
              onValueChange={(value) => handleGeneralChange('dateFormat', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="timeFormat">Time Format</Label>
            <Select 
              value={generalSettings.timeFormat} 
              onValueChange={(value) => handleGeneralChange('timeFormat', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12-hour">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24-hour">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="language">Language</Label>
            <Select 
              value={generalSettings.language} 
              onValueChange={(value) => handleGeneralChange('language', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="es-ES">Spanish</SelectItem>
                <SelectItem value="fr-FR">French</SelectItem>
                <SelectItem value="de-DE">German</SelectItem>
                <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fiscalYear">Fiscal Year Start</Label>
            <Input
              id="fiscalYear"
              type="text"
              placeholder="MM-DD"
              value={generalSettings.fiscalYearStart}
              onChange={(e) => handleGeneralChange('fiscalYearStart', e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenance">Maintenance Mode</Label>
                <p className="text-sm text-gray-500">Temporarily disable access for non-administrators</p>
              </div>
              <Switch
                id="maintenance"
                checked={generalSettings.maintenanceMode}
                onCheckedChange={(checked) => handleGeneralChange('maintenanceMode', checked)}
              />
            </div>
            {generalSettings.maintenanceMode && (
              <Textarea
                className="mt-2"
                placeholder="Maintenance message..."
                value={generalSettings.maintenanceMessage}
                onChange={(e) => handleGeneralChange('maintenanceMessage', e.target.value)}
                rows={2}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Password policies and security configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="passwordLength">Minimum Password Length</Label>
              <Input
                id="passwordLength"
                type="number"
                value={securitySettings.passwordMinLength}
                onChange={(e) => handleSecurityChange('passwordMinLength', parseInt(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="passwordExpire">Password Expiration (days)</Label>
              <Input
                id="passwordExpire"
                type="number"
                value={securitySettings.passwordExpireDays}
                onChange={(e) => handleSecurityChange('passwordExpireDays', parseInt(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={securitySettings.sessionTimeout}
                onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="maxAttempts">Max Login Attempts</Label>
              <Input
                id="maxAttempts"
                type="number"
                value={securitySettings.maxLoginAttempts}
                onChange={(e) => handleSecurityChange('maxLoginAttempts', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Require Uppercase Letters</Label>
              <Switch
                checked={securitySettings.passwordRequireUppercase}
                onCheckedChange={(checked) => handleSecurityChange('passwordRequireUppercase', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Require Lowercase Letters</Label>
              <Switch
                checked={securitySettings.passwordRequireLowercase}
                onCheckedChange={(checked) => handleSecurityChange('passwordRequireLowercase', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Require Numbers</Label>
              <Switch
                checked={securitySettings.passwordRequireNumbers}
                onCheckedChange={(checked) => handleSecurityChange('passwordRequireNumbers', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Require Special Characters</Label>
              <Switch
                checked={securitySettings.passwordRequireSpecialChars}
                onCheckedChange={(checked) => handleSecurityChange('passwordRequireSpecialChars', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-gray-500">Require 2FA for all users</p>
              </div>
              <Switch
                checked={securitySettings.twoFactorEnabled}
                onCheckedChange={(checked) => handleSecurityChange('twoFactorEnabled', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Settings
          </CardTitle>
          <CardDescription>
            Configure email server for system notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="smtpHost">SMTP Host</Label>
            <Input
              id="smtpHost"
              value={emailSettings.smtpHost}
              onChange={(e) => handleEmailChange('smtpHost', e.target.value)}
              placeholder="smtp.gmail.com"
            />
          </div>

          <div>
            <Label htmlFor="smtpPort">SMTP Port</Label>
            <Input
              id="smtpPort"
              type="number"
              value={emailSettings.smtpPort}
              onChange={(e) => handleEmailChange('smtpPort', parseInt(e.target.value))}
            />
          </div>

          <div>
            <Label htmlFor="smtpUser">SMTP Username</Label>
            <Input
              id="smtpUser"
              value={emailSettings.smtpUser}
              onChange={(e) => handleEmailChange('smtpUser', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="smtpPassword">SMTP Password</Label>
            <Input
              id="smtpPassword"
              type="password"
              value={emailSettings.smtpPassword}
              onChange={(e) => handleEmailChange('smtpPassword', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="fromEmail">From Email</Label>
            <Input
              id="fromEmail"
              type="email"
              value={emailSettings.fromEmail}
              onChange={(e) => handleEmailChange('fromEmail', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="fromName">From Name</Label>
            <Input
              id="fromName"
              value={emailSettings.fromName}
              onChange={(e) => handleEmailChange('fromName', e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="testEmail">Test Email Address</Label>
            <div className="flex gap-2">
              <Input
                id="testEmail"
                type="email"
                value={emailSettings.testEmailAddress}
                onChange={(e) => handleEmailChange('testEmailAddress', e.target.value)}
                placeholder="test@example.com"
              />
              <Button onClick={testEmailConnection}>Send Test</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup Settings
          </CardTitle>
          <CardDescription>
            Configure automatic database backups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Automatic Backup</Label>
              <p className="text-sm text-gray-500">Enable scheduled database backups</p>
            </div>
            <Switch
              checked={backupSettings.autoBackup}
              onCheckedChange={(checked) => handleBackupChange('autoBackup', checked)}
            />
          </div>

          {backupSettings.autoBackup && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="backupFreq">Backup Frequency</Label>
                <Select 
                  value={backupSettings.backupFrequency} 
                  onValueChange={(value) => handleBackupChange('backupFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="backupTime">Backup Time</Label>
                <Input
                  id="backupTime"
                  type="time"
                  value={backupSettings.backupTime}
                  onChange={(e) => handleBackupChange('backupTime', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="retention">Retention Period (days)</Label>
                <Input
                  id="retention"
                  type="number"
                  value={backupSettings.backupRetentionDays}
                  onChange={(e) => handleBackupChange('backupRetentionDays', parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="backupLocation">Backup Location</Label>
                <Select 
                  value={backupSettings.backupLocation} 
                  onValueChange={(value) => handleBackupChange('backupLocation', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local Storage</SelectItem>
                    <SelectItem value="cloud">Cloud Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Last Backup</p>
              <p className="text-sm text-gray-500">{backupSettings.lastBackup}</p>
            </div>
            <Button onClick={runBackupNow}>
              <Database className="mr-2 h-4 w-4" />
              Backup Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save System Settings
        </Button>
      </div>
    </div>
  );
}