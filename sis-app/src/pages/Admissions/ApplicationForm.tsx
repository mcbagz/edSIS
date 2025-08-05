import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/atoms/Input';
import { Button } from '../../components/atoms/Button';
import { Select } from '../../components/atoms/Select';
import { DatePicker } from '../../components/atoms/DatePicker';
import { useToast } from '../../components/molecules/Toast/useToast';
import { applicationService } from '../../services/applicationService';
import type { ProspectiveStudent } from '../../types/application';

const ApplicationForm: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProspectiveStudent>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    ethnicity: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
    guardianRelation: '',
  });
  const [notes, setNotes] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await applicationService.createApplication({
        prospectiveStudent: formData,
        notes,
      });
      showToast('Application submitted successfully', 'success');
      navigate('/admissions/applications');
    } catch (error) {
      showToast('Failed to submit application', 'error');
      console.error('Error submitting application:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Application</h1>
        <p className="text-gray-600 mt-1">Submit a new student application for admission</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Student Information */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
            <DatePicker
              label="Date of Birth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={(date) => setFormData(prev => ({ ...prev, dateOfBirth: date }))}
              required
            />
            <Select
              label="Gender"
              name="gender"
              value={formData.gender || ''}
              onChange={handleInputChange}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
            <Select
              label="Ethnicity"
              name="ethnicity"
              value={formData.ethnicity || ''}
              onChange={handleInputChange}
            >
              <option value="">Select Ethnicity</option>
              <option value="Asian">Asian</option>
              <option value="Black or African American">Black or African American</option>
              <option value="Hispanic or Latino">Hispanic or Latino</option>
              <option value="Native American">Native American</option>
              <option value="Pacific Islander">Pacific Islander</option>
              <option value="White">White</option>
              <option value="Two or More Races">Two or More Races</option>
              <option value="Other">Other</option>
            </Select>
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleInputChange}
            />
            <Input
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Street Address"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
              />
            </div>
            <Input
              label="City"
              name="city"
              value={formData.city || ''}
              onChange={handleInputChange}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="State"
                name="state"
                value={formData.state || ''}
                onChange={handleInputChange}
                maxLength={2}
              />
              <Input
                label="ZIP Code"
                name="zipCode"
                value={formData.zipCode || ''}
                onChange={handleInputChange}
                maxLength={10}
              />
            </div>
          </div>
        </div>

        {/* Guardian Information */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Guardian Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Guardian Name"
              name="guardianName"
              value={formData.guardianName}
              onChange={handleInputChange}
              required
            />
            <Select
              label="Relationship"
              name="guardianRelation"
              value={formData.guardianRelation}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Relationship</option>
              <option value="Mother">Mother</option>
              <option value="Father">Father</option>
              <option value="Guardian">Guardian</option>
              <option value="Grandparent">Grandparent</option>
              <option value="Other">Other</option>
            </Select>
            <Input
              label="Guardian Email"
              name="guardianEmail"
              type="email"
              value={formData.guardianEmail}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Guardian Phone"
              name="guardianPhone"
              type="tel"
              value={formData.guardianPhone}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        {/* Additional Notes */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
          <textarea
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any additional information about the applicant..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/admissions/applications')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            Submit Application
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;