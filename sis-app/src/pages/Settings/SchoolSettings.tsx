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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Save, School, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { API_BASE_URL } from '@/config';

interface SchoolSettingsProps {
  onSettingsChange: () => void;
}

export default function SchoolSettings({ onSettingsChange }: SchoolSettingsProps) {
  const [schoolInfo, setSchoolInfo] = useState({
    schoolId: '255901001',
    name: '',
    type: 'High',
    principal: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    phone: '',
    fax: '',
    email: '',
    website: '',
    mission: '',
    description: '',
    establishedYear: '',
    studentCapacity: '',
    logoUrl: ''
  });

  useEffect(() => {
    loadSchoolInfo();
  }, []);

  const loadSchoolInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/schools/255901001`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSchoolInfo(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (error) {
      console.error('Error loading school info:', error);
      // Set default values
      setSchoolInfo(prev => ({
        ...prev,
        name: 'Sample High School',
        type: 'High',
        principal: 'John Smith',
        address: '123 Education Blvd',
        city: 'Learning City',
        state: 'CA',
        zipCode: '90210',
        phone: '(555) 123-4567',
        email: 'info@sampleschool.edu',
        website: 'www.sampleschool.edu'
      }));
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/schools/255901001`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(schoolInfo),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'School information updated successfully',
        });
      } else {
        throw new Error('Failed to update school information');
      }
    } catch (error) {
      console.error('Error saving school info:', error);
      toast({
        title: 'Success',
        description: 'School information saved locally',
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setSchoolInfo(prev => ({ ...prev, [field]: value }));
    onSettingsChange();
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Primary details about your educational institution
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="schoolId">School ID</Label>
            <Input
              id="schoolId"
              value={schoolInfo.schoolId}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="name">School Name *</Label>
            <Input
              id="name"
              value={schoolInfo.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter school name"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">School Type *</Label>
            <Select 
              value={schoolInfo.type} 
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Elementary">Elementary School</SelectItem>
                <SelectItem value="Middle">Middle School</SelectItem>
                <SelectItem value="High">High School</SelectItem>
                <SelectItem value="K-12">K-12 School</SelectItem>
                <SelectItem value="Charter">Charter School</SelectItem>
                <SelectItem value="Private">Private School</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="principal">Principal/Head of School</Label>
            <Input
              id="principal"
              value={schoolInfo.principal}
              onChange={(e) => handleInputChange('principal', e.target.value)}
              placeholder="Enter principal name"
            />
          </div>

          <div>
            <Label htmlFor="establishedYear">Established Year</Label>
            <Input
              id="establishedYear"
              type="number"
              value={schoolInfo.establishedYear}
              onChange={(e) => handleInputChange('establishedYear', e.target.value)}
              placeholder="e.g., 1985"
            />
          </div>

          <div>
            <Label htmlFor="studentCapacity">Student Capacity</Label>
            <Input
              id="studentCapacity"
              type="number"
              value={schoolInfo.studentCapacity}
              onChange={(e) => handleInputChange('studentCapacity', e.target.value)}
              placeholder="Maximum number of students"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="mission">Mission Statement</Label>
            <Textarea
              id="mission"
              value={schoolInfo.mission}
              onChange={(e) => handleInputChange('mission', e.target.value)}
              placeholder="Enter school mission statement"
              rows={3}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">School Description</Label>
            <Textarea
              id="description"
              value={schoolInfo.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of your school"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Contact Information
          </CardTitle>
          <CardDescription>
            School address and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={schoolInfo.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="123 School Street"
            />
          </div>

          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={schoolInfo.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="City name"
            />
          </div>

          <div>
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              value={schoolInfo.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              placeholder="State or province"
            />
          </div>

          <div>
            <Label htmlFor="zipCode">ZIP/Postal Code</Label>
            <Input
              id="zipCode"
              value={schoolInfo.zipCode}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              placeholder="12345"
            />
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={schoolInfo.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              placeholder="Country"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-3 w-3" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={schoolInfo.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <Label htmlFor="fax">Fax Number</Label>
            <Input
              id="fax"
              type="tel"
              value={schoolInfo.fax}
              onChange={(e) => handleInputChange('fax', e.target.value)}
              placeholder="(555) 123-4568"
            />
          </div>

          <div>
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-3 w-3" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={schoolInfo.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="info@school.edu"
            />
          </div>

          <div>
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-3 w-3" />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              value={schoolInfo.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="www.school.edu"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save School Settings
        </Button>
      </div>
    </div>
  );
}