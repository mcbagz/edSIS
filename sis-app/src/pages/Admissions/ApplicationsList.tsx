import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '../../components/molecules/Table';
import { Button } from '../../components/atoms/Button';
import { Select } from '../../components/atoms/Select';
import { useToast } from '../../components/molecules/Toast/useToast';
import { applicationService } from '../../services/applicationService';
import type { Application } from '../../types/application';

const ApplicationsList: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, pagination.page]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationService.listApplications({
        status: statusFilter || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setApplications(response.applications);
      setPagination(response.pagination);
    } catch (error) {
      showToast('Failed to fetch applications', 'error');
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: 'ACCEPTED' | 'REJECTED') => {
    try {
      await applicationService.updateApplicationStatus(applicationId, newStatus);
      showToast(`Application ${newStatus.toLowerCase()}`, 'success');
      
      // If accepted, trigger student creation workflow
      if (newStatus === 'ACCEPTED') {
        await applicationService.processAcceptedApplication(applicationId);
      }
      
      fetchApplications();
    } catch (error) {
      showToast('Failed to update application status', 'error');
      console.error('Error updating status:', error);
    }
  };

  const columns = [
    {
      key: 'prospectiveStudent.firstName',
      header: 'First Name',
      render: (application: Application) => application.prospectiveStudent.firstName,
    },
    {
      key: 'prospectiveStudent.lastName',
      header: 'Last Name',
      render: (application: Application) => application.prospectiveStudent.lastName,
    },
    {
      key: 'prospectiveStudent.dateOfBirth',
      header: 'Date of Birth',
      render: (application: Application) => 
        new Date(application.prospectiveStudent.dateOfBirth).toLocaleDateString(),
    },
    {
      key: 'prospectiveStudent.gradeLevel',
      header: 'Grade',
      render: () => '9', // Default for new applicants
    },
    {
      key: 'applicationDate',
      header: 'Applied On',
      render: (application: Application) => 
        new Date(application.applicationDate).toLocaleDateString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (application: Application) => (
        <span className={`px-2 py-1 rounded text-sm font-medium ${
          application.status === 'APPLIED' ? 'bg-yellow-100 text-yellow-800' :
          application.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {application.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (application: Application) => (
        <div className="flex gap-2">
          <Button
            size="small"
            variant="secondary"
            onClick={() => navigate(`/admissions/applications/${application.id}`)}
          >
            View
          </Button>
          {application.status === 'APPLIED' && (
            <>
              <Button
                size="small"
                variant="primary"
                onClick={() => handleStatusChange(application.id, 'ACCEPTED')}
              >
                Accept
              </Button>
              <Button
                size="small"
                variant="secondary"
                onClick={() => handleStatusChange(application.id, 'REJECTED')}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-600 mt-1">Manage student applications for admission</p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-4">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          >
            <option value="">All Status</option>
            <option value="APPLIED">Applied</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </Select>
        </div>
        <Button
          onClick={() => navigate('/admissions/applications/new')}
          variant="primary"
        >
          New Application
        </Button>
      </div>

      <Table
        data={applications}
        columns={columns}
        loading={loading}
        pagination={{
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
          onPageChange: (page) => setPagination(prev => ({ ...prev, page })),
        }}
      />
    </div>
  );
};

export default ApplicationsList;