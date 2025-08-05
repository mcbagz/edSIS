import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/atoms/Button';
import { useToast } from '../../components/molecules/Toast/useToast';
import { enrollmentService } from '../../services/enrollmentService';
import { studentService } from '../../services/studentService';
import type { Student } from '../../types/student';
import type { AvailableCourse, Homeroom } from '../../types/enrollment';

interface WizardStep {
  id: number;
  title: string;
  description: string;
}

const steps: WizardStep[] = [
  {
    id: 1,
    title: 'Verify Information',
    description: 'Review and confirm your personal information',
  },
  {
    id: 2,
    title: 'Select Courses',
    description: 'Choose your courses for the upcoming semester',
  },
  {
    id: 3,
    title: 'Choose Homeroom',
    description: 'Select your homeroom assignment',
  },
  {
    id: 4,
    title: 'Review & Confirm',
    description: 'Review your selections and complete enrollment',
  },
];

const EnrollmentWizard: React.FC = () => {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);
  const [availableHomerooms, setAvailableHomerooms] = useState<Homeroom[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedHomeroom, setSelectedHomeroom] = useState<string>('');

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);

  useEffect(() => {
    if (student && currentStep === 2) {
      fetchAvailableCourses();
    } else if (student && currentStep === 3) {
      fetchAvailableHomerooms();
    }
  }, [currentStep, student]);

  const fetchStudentData = async () => {
    try {
      const data = await studentService.getStudent(studentId!);
      setStudent(data);
    } catch (error) {
      showToast('Failed to load student data', 'error');
      console.error('Error fetching student:', error);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      setLoading(true);
      // TODO: Get actual session ID from context or API
      const courses = await enrollmentService.getAvailableCourses(student!.gradeLevel, 'current-session-id');
      setAvailableCourses(courses);
    } catch (error) {
      showToast('Failed to load available courses', 'error');
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableHomerooms = async () => {
    try {
      setLoading(true);
      const homerooms = await enrollmentService.getAvailableHomerooms(student!.gradeLevel);
      setAvailableHomerooms(homerooms);
    } catch (error) {
      showToast('Failed to load available homerooms', 'error');
      console.error('Error fetching homerooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseToggle = (sectionId: string) => {
    setSelectedCourses(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      }
      return [...prev, sectionId];
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      await enrollmentService.enrollStudent({
        studentId: studentId!,
        courseSectionIds: selectedCourses,
        homeroomId: selectedHomeroom,
      });
      showToast('Enrollment completed successfully!', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      if (error.response?.data?.conflicts) {
        showToast('Schedule conflicts detected. Please review your course selections.', 'error');
      } else {
        showToast('Failed to complete enrollment', 'error');
      }
      console.error('Error completing enrollment:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            {student && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><strong>Name:</strong> {student.firstName} {student.lastName}</p>
                <p><strong>Grade Level:</strong> {student.gradeLevel}</p>
                <p><strong>Email:</strong> {student.email || 'Not provided'}</p>
                <p><strong>Phone:</strong> {student.phone || 'Not provided'}</p>
                <p><strong>Address:</strong> {student.address || 'Not provided'}</p>
              </div>
            )}
            <p className="text-sm text-gray-600">
              Please verify that the above information is correct. If any changes are needed, 
              please contact the admissions office.
            </p>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Your Courses</h3>
            <p className="text-sm text-gray-600">
              Choose the courses you want to enroll in for the upcoming semester. 
              Pay attention to available seats and schedule conflicts.
            </p>
            {loading ? (
              <div className="text-center py-8">Loading available courses...</div>
            ) : (
              <div className="space-y-4">
                {availableCourses.map(({ course, sections }) => (
                  <div key={course.id} className="border rounded-lg p-4">
                    <div className="mb-3">
                      <h4 className="font-semibold">{course.name} ({course.courseCode})</h4>
                      <p className="text-sm text-gray-600">{course.description}</p>
                      <p className="text-sm text-gray-500">Credits: {course.credits}</p>
                    </div>
                    <div className="space-y-2">
                      {sections.map(section => (
                        <label 
                          key={section.id}
                          className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCourses.includes(section.id)}
                            onChange={() => handleCourseToggle(section.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span className="font-medium">Section {section.sectionIdentifier}</span>
                              <span className="text-sm text-gray-500">
                                {section.availableSeats} seats available
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {section.teacher} • {section.time} • {section.days.join(', ')}
                              {section.roomNumber && ` • Room ${section.roomNumber}`}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Your Homeroom</h3>
            <p className="text-sm text-gray-600">
              Choose your homeroom assignment for the school year.
            </p>
            {loading ? (
              <div className="text-center py-8">Loading available homerooms...</div>
            ) : (
              <div className="space-y-2">
                {availableHomerooms.map(homeroom => (
                  <label 
                    key={homeroom.id}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="homeroom"
                      value={homeroom.id}
                      checked={selectedHomeroom === homeroom.id}
                      onChange={(e) => setSelectedHomeroom(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">Homeroom {homeroom.name}</span>
                        <span className="text-sm text-gray-500">
                          {homeroom.availableSeats} seats available
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {homeroom.teacher}
                        {homeroom.roomNumber && ` • Room ${homeroom.roomNumber}`}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Your Enrollment</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Selected Courses:</h4>
                {selectedCourses.length === 0 ? (
                  <p className="text-gray-600">No courses selected</p>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    {selectedCourses.map(sectionId => {
                      const course = availableCourses.find(c => 
                        c.sections.some(s => s.id === sectionId)
                      );
                      const section = course?.sections.find(s => s.id === sectionId);
                      return (
                        <li key={sectionId} className="text-sm">
                          {course?.course.name} - Section {section?.sectionIdentifier}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div>
                <h4 className="font-semibold mb-2">Selected Homeroom:</h4>
                {selectedHomeroom ? (
                  <p className="text-sm">
                    {availableHomerooms.find(h => h.id === selectedHomeroom)?.name}
                  </p>
                ) : (
                  <p className="text-gray-600">No homeroom selected</p>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Please review your selections carefully. Once you confirm, your enrollment will be processed.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Enrollment Wizard</h1>
        <p className="text-gray-600 mt-1">Complete your enrollment for the upcoming semester</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep > step.id ? 'bg-green-600 text-white' :
                currentStep === step.id ? 'bg-blue-600 text-white' :
                'bg-gray-300 text-gray-600'
              }`}>
                {currentStep > step.id ? '✓' : step.id}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-full h-1 mx-2 ${
                  currentStep > step.id ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <h2 className="text-lg font-semibold">{steps[currentStep - 1].title}</h2>
          <p className="text-gray-600">{steps[currentStep - 1].description}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Back
        </Button>
        {currentStep < steps.length ? (
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={
              (currentStep === 2 && selectedCourses.length === 0) ||
              (currentStep === 3 && !selectedHomeroom)
            }
          >
            Next
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleComplete}
            loading={loading}
            disabled={selectedCourses.length === 0 || !selectedHomeroom}
          >
            Complete Enrollment
          </Button>
        )}
      </div>
    </div>
  );
};

export default EnrollmentWizard;