import axios from 'axios';
import { PrismaClient } from '../generated/prisma';
import https from 'https';

const prisma = new PrismaClient();

interface EdFiConfig {
  baseUrl: string;
  oauthUrl: string;
  clientId: string;
  clientSecret: string;
}

interface EdFiStudent {
  studentUniqueId: string;
  firstName: string;
  lastSurname: string;
  middleName?: string;
  birthDate: string;
  birthSexDescriptor?: string;
  addresses?: Array<{
    addressTypeDescriptor: string;
    streetNumberName?: string;
    city?: string;
    stateAbbreviationDescriptor?: string;
    postalCode?: string;
  }>;
  electronicMails?: Array<{
    electronicMailTypeDescriptor: string;
    electronicMailAddress?: string;
  }>;
  telephoneNumbers?: Array<{
    telephoneNumberTypeDescriptor: string;
    telephoneNumber?: string;
  }>;
}

interface EdFiSchool {
  schoolId: number;
  nameOfInstitution: string;
  educationOrganizationCategories: Array<{
    educationOrganizationCategoryDescriptor: string;
  }>;
  gradeLevels?: Array<{
    gradeLevelDescriptor: string;
  }>;
  addresses?: Array<{
    addressTypeDescriptor: string;
    streetNumberName?: string;
    city?: string;
    stateAbbreviationDescriptor?: string;
    postalCode?: string;
  }>;
  telephoneNumbers?: Array<{
    telephoneNumberTypeDescriptor: string;
    telephoneNumber?: string;
  }>;
}

interface EdFiCourse {
  educationOrganizationReference: {
    educationOrganizationId: number;
  };
  courseCode: string;
  courseTitle: string;
  courseDescription?: string;
  numberOfParts: number;
  academicSubjectDescriptor?: string;
  courseLevelCharacteristics?: Array<{
    courseLevelCharacteristicDescriptor: string;
  }>;
}

interface EdFiSection {
  sectionIdentifier: string;
  courseOfferingReference: {
    localCourseCode: string;
    schoolId: number;
    schoolYear: number;
    sessionName: string;
  };
  availableCredits?: number;
  classPeriods?: Array<{
    classPeriodReference: {
      classPeriodName: string;
      schoolId: number;
    };
  }>;
}

interface EdFiStudentSchoolAssociation {
  studentReference: {
    studentUniqueId: string;
  };
  schoolReference: {
    schoolId: number;
  };
  entryDate: string;
  entryGradeLevelDescriptor: string;
  exitWithdrawDate?: string;
  exitWithdrawTypeDescriptor?: string;
}

interface EdFiStudentSectionAssociation {
  studentReference: {
    studentUniqueId: string;
  };
  sectionReference: {
    localCourseCode: string;
    schoolId: number;
    schoolYear: number;
    sectionIdentifier: string;
    sessionName: string;
  };
  beginDate: string;
  endDate?: string;
}

interface EdFiGrade {
  studentReference: {
    studentUniqueId: string;
  };
  studentSectionAssociationReference: {
    beginDate: string;
    localCourseCode: string;
    schoolId: number;
    schoolYear: number;
    sectionIdentifier: string;
    sessionName: string;
    studentUniqueId: string;
  };
  gradingPeriodReference: {
    gradingPeriodDescriptor: string;
    periodSequence: number;
    schoolId: number;
    schoolYear: number;
  };
  gradeTypeDescriptor: string;
  numericGradeEarned?: number;
  letterGradeEarned?: string;
}

class EdFiService {
  private config: EdFiConfig;
  private axiosInstance: any;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.config = {
      baseUrl: process.env.EDFI_BASE_URL || 'http://localhost:8001',
      oauthUrl: process.env.EDFI_OAUTH_URL || 'http://localhost:8001/oauth/token',
      clientId: process.env.EDFI_CLIENT_ID || 'populatedKey',
      clientSecret: process.env.EDFI_CLIENT_SECRET || 'populatedSecret'
    };

    const isHttps = this.config.baseUrl.startsWith('https');
    
    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      ...(isHttps && { httpsAgent: new https.Agent({ rejectUnauthorized: false }) })
    });
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
      const response = await this.axiosInstance.post(
        '/oauth/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
          }
        }
      );

      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiry = new Date(Date.now() + (expiresIn - 60) * 1000);

      return this.accessToken as string;
    } catch (error) {
      console.error('Failed to obtain Ed-Fi access token:', error);
      throw new Error('Failed to authenticate with Ed-Fi ODS');
    }
  }

  private async makeAuthenticatedRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const token = await this.getAccessToken();
    const url = `/data/v3/ed-fi/${endpoint}`;

    try {
      const response = await this.axiosInstance.request({
        method,
        url,
        data,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.accessToken = null;
        this.tokenExpiry = null;
        const newToken = await this.getAccessToken();
        
        const retryResponse = await this.axiosInstance.request({
          method,
          url,
          data,
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json'
          }
        });
        return retryResponse.data;
      }
      
      console.error(`Ed-Fi API error for ${endpoint}:`, error.response?.data || error.message);
      throw error;
    }
  }

  private mapGradeLevel(gradeLevel: string): string {
    const gradeLevelMap: { [key: string]: string } = {
      'K': 'Kindergarten',
      '1': 'First Grade',
      '2': 'Second Grade',
      '3': 'Third Grade',
      '4': 'Fourth Grade',
      '5': 'Fifth Grade',
      '6': 'Sixth Grade',
      '7': 'Seventh Grade',
      '8': 'Eighth Grade',
      '9': 'Ninth Grade',
      '10': 'Tenth Grade',
      '11': 'Eleventh Grade',
      '12': 'Twelfth Grade',
      'Kindergarten': 'Kindergarten',
      'First': 'First Grade',
      'Second': 'Second Grade',
      'Third': 'Third Grade',
      'Fourth': 'Fourth Grade',
      'Fifth': 'Fifth Grade',
      'Sixth': 'Sixth Grade',
      'Seventh': 'Seventh Grade',
      'Eighth': 'Eighth Grade',
      'Ninth': 'Ninth Grade',
      'Tenth': 'Tenth Grade',
      'Eleventh': 'Eleventh Grade',
      'Twelfth': 'Twelfth Grade'
    };

    return gradeLevelMap[gradeLevel] || gradeLevel;
  }

  private getCurrentSchoolYear(): number {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return month >= 7 ? year + 1 : year;
  }

  async syncStudent(studentId: string): Promise<void> {
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          enrollments: {
            include: {
              courseSection: {
                include: {
                  school: true
                }
              },
              homeroom: {
                include: {
                  school: true
                }
              }
            }
          }
        }
      });

      if (!student) {
        throw new Error(`Student not found: ${studentId}`);
      }

      // First check if student already exists in Ed-Fi
      try {
        const existingStudent = await this.makeAuthenticatedRequest('GET', `students/${student.studentUniqueId}`, null);
        if (existingStudent) {
          console.log(`Student ${student.studentUniqueId} already exists in Ed-Fi, skipping creation`);
          return;
        }
      } catch (error: any) {
        // Student doesn't exist, we'll create it
      }

      // Get the school from enrollments
      let schoolId = 255901001; // Default to Grand Bend High School
      if (student.enrollments.length > 0) {
        const enrollment = student.enrollments[0];
        if (enrollment.homeroom?.school) {
          schoolId = enrollment.homeroom.school.schoolId;
        } else if (enrollment.courseSection?.school) {
          schoolId = enrollment.courseSection.school.schoolId;
        }
      }

      // First create the student-school association to establish context
      const association: EdFiStudentSchoolAssociation = {
        studentReference: {
          studentUniqueId: student.studentUniqueId
        },
        schoolReference: {
          schoolId: schoolId
        },
        entryDate: student.enrollmentDate.toISOString().split('T')[0],
        entryGradeLevelDescriptor: `uri://ed-fi.org/GradeLevelDescriptor#${this.mapGradeLevel(student.gradeLevel)}`
      };

      try {
        await this.makeAuthenticatedRequest('POST', 'studentSchoolAssociations', association);
        console.log(`Created student-school association for ${student.studentUniqueId} with school ${schoolId}`);
      } catch (error: any) {
        if (error.response?.status === 409) {
          console.log(`Student-school association already exists for ${student.studentUniqueId}`);
        } else if (error.response?.status === 400 && error.response?.data?.detail?.includes('student')) {
          // Student doesn't exist yet, we need to create it first
          console.log(`Student ${student.studentUniqueId} doesn't exist, creating student first`);
        } else {
          console.error('Failed to create initial student-school association:', error.response?.data);
        }
      }

      // Now create the student
      const edfiStudent: EdFiStudent = {
        studentUniqueId: student.studentUniqueId,
        firstName: student.firstName,
        lastSurname: student.lastName,
        middleName: student.middleName || undefined,
        birthDate: student.birthDate.toISOString().split('T')[0],
        birthSexDescriptor: student.gender ? `uri://ed-fi.org/SexDescriptor#${student.gender}` : undefined,
        addresses: student.address ? [{
          addressTypeDescriptor: 'uri://ed-fi.org/AddressTypeDescriptor#Home',
          streetNumberName: student.address,
          city: student.city || undefined,
          stateAbbreviationDescriptor: student.state ? `uri://ed-fi.org/StateAbbreviationDescriptor#${student.state}` : undefined,
          postalCode: student.zipCode || undefined
        }] : undefined,
        electronicMails: student.email ? [{
          electronicMailTypeDescriptor: 'uri://ed-fi.org/ElectronicMailTypeDescriptor#Personal',
          electronicMailAddress: student.email
        }] : undefined,
        telephoneNumbers: student.phone ? [{
          telephoneNumberTypeDescriptor: 'uri://ed-fi.org/TelephoneNumberTypeDescriptor#Mobile',
          telephoneNumber: student.phone
        }] : undefined
      };

      try {
        await this.makeAuthenticatedRequest('POST', 'students', edfiStudent);
        console.log(`Successfully synced student ${student.studentUniqueId} to Ed-Fi`);
      } catch (error: any) {
        if (error.response?.status === 409) {
          console.log(`Student ${student.studentUniqueId} already exists in Ed-Fi`);
        } else {
          throw error;
        }
      }

      // Try to create the association again if the student was just created
      try {
        await this.makeAuthenticatedRequest('POST', 'studentSchoolAssociations', association);
        console.log(`Created student-school association for ${student.studentUniqueId}`);
      } catch (error: any) {
        if (error.response?.status !== 409) {
          console.error('Failed to create student-school association after student creation:', error.response?.data);
        }
      }
    } catch (error) {
      console.error(`Failed to sync student ${studentId}:`, error);
      throw error;
    }
  }

  async syncSchool(schoolId: string): Promise<void> {
    try {
      const school = await prisma.school.findUnique({
        where: { id: schoolId }
      });

      if (!school) {
        throw new Error(`School not found: ${schoolId}`);
      }

      const gradeLevels = [];
      if (school.type === 'Elementary') {
        gradeLevels.push(
          { gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#Kindergarten' },
          { gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#First Grade' },
          { gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#Second Grade' },
          { gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#Third Grade' },
          { gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#Fourth Grade' },
          { gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#Fifth Grade' }
        );
      } else if (school.type === 'Middle') {
        gradeLevels.push(
          { gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#Sixth Grade' },
          { gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#Seventh Grade' },
          { gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#Eighth Grade' }
        );
      } else if (school.type === 'High') {
        gradeLevels.push(
          { gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#Ninth Grade' },
          { gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#Tenth Grade' },
          { gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#Eleventh Grade' },
          { gradeLevelDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#Twelfth Grade' }
        );
      }

      const edfiSchool: EdFiSchool = {
        schoolId: school.schoolId,
        nameOfInstitution: school.name,
        educationOrganizationCategories: [{
          educationOrganizationCategoryDescriptor: 'uri://ed-fi.org/EducationOrganizationCategoryDescriptor#School'
        }],
        gradeLevels,
        addresses: school.address ? [{
          addressTypeDescriptor: 'uri://ed-fi.org/AddressTypeDescriptor#Physical',
          streetNumberName: school.address,
          city: school.city || undefined,
          stateAbbreviationDescriptor: school.state ? `uri://ed-fi.org/StateAbbreviationDescriptor#${school.state}` : undefined,
          postalCode: school.zipCode || undefined
        }] : undefined,
        telephoneNumbers: school.phone ? [{
          telephoneNumberTypeDescriptor: 'uri://ed-fi.org/TelephoneNumberTypeDescriptor#Main',
          telephoneNumber: school.phone
        }] : undefined
      };

      await this.makeAuthenticatedRequest('POST', 'schools', edfiSchool);
      console.log(`Successfully synced school ${school.schoolId} to Ed-Fi`);
    } catch (error) {
      console.error(`Failed to sync school ${schoolId}:`, error);
      throw error;
    }
  }

  async syncCourse(courseId: string): Promise<void> {
    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          school: true
        }
      });

      if (!course) {
        throw new Error(`Course not found: ${courseId}`);
      }

      const edfiCourse: EdFiCourse = {
        educationOrganizationReference: {
          educationOrganizationId: course.school.schoolId
        },
        courseCode: course.courseCode,
        courseTitle: course.name,
        courseDescription: course.description || undefined,
        numberOfParts: 1,
        academicSubjectDescriptor: course.department ? 
          `uri://ed-fi.org/AcademicSubjectDescriptor#${course.department}` : undefined
      };

      await this.makeAuthenticatedRequest('POST', 'courses', edfiCourse);
      console.log(`Successfully synced course ${course.courseCode} to Ed-Fi`);
    } catch (error) {
      console.error(`Failed to sync course ${courseId}:`, error);
      throw error;
    }
  }

  async syncCourseSection(courseSectionId: string): Promise<void> {
    try {
      const section = await prisma.courseSection.findUnique({
        where: { id: courseSectionId },
        include: {
          course: true,
          school: true,
          session: true,
          teacher: true,
          enrollments: {
            include: {
              student: true
            }
          }
        }
      });

      if (!section) {
        throw new Error(`Course section not found: ${courseSectionId}`);
      }

      const schoolYear = this.getCurrentSchoolYear();

      const edfiSection: EdFiSection = {
        sectionIdentifier: section.sectionIdentifier,
        courseOfferingReference: {
          localCourseCode: section.course.courseCode,
          schoolId: section.school.schoolId,
          schoolYear,
          sessionName: section.session.name
        },
        availableCredits: section.course.credits
      };

      await this.makeAuthenticatedRequest('POST', 'sections', edfiSection);
      console.log(`Successfully synced section ${section.sectionIdentifier} to Ed-Fi`);

      for (const enrollment of section.enrollments) {
        if (enrollment.status === 'Active') {
          const association: EdFiStudentSectionAssociation = {
            studentReference: {
              studentUniqueId: enrollment.student.studentUniqueId
            },
            sectionReference: {
              localCourseCode: section.course.courseCode,
              schoolId: section.school.schoolId,
              schoolYear,
              sectionIdentifier: section.sectionIdentifier,
              sessionName: section.session.name
            },
            beginDate: enrollment.enrollmentDate.toISOString().split('T')[0],
            endDate: enrollment.exitDate?.toISOString().split('T')[0]
          };

          try {
            await this.makeAuthenticatedRequest('POST', 'studentSectionAssociations', association);
            console.log(`Successfully created student-section association for ${enrollment.student.studentUniqueId}`);
          } catch (error: any) {
            if (error.response?.status !== 409) {
              console.error('Failed to create student-section association:', error.response?.data);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Failed to sync course section ${courseSectionId}:`, error);
      throw error;
    }
  }

  async syncGrade(gradeId: string): Promise<void> {
    try {
      const grade = await prisma.grade.findUnique({
        where: { id: gradeId },
        include: {
          student: true,
          courseSection: {
            include: {
              course: true,
              school: true,
              session: true
            }
          },
          gradingPeriod: true
        }
      });

      if (!grade) {
        throw new Error(`Grade not found: ${gradeId}`);
      }

      const schoolYear = this.getCurrentSchoolYear();

      const edfiGrade: EdFiGrade = {
        studentReference: {
          studentUniqueId: grade.student.studentUniqueId
        },
        studentSectionAssociationReference: {
          beginDate: grade.courseSection.createdAt.toISOString().split('T')[0],
          localCourseCode: grade.courseSection.course.courseCode,
          schoolId: grade.courseSection.school.schoolId,
          schoolYear,
          sectionIdentifier: grade.courseSection.sectionIdentifier,
          sessionName: grade.courseSection.session.name,
          studentUniqueId: grade.student.studentUniqueId
        },
        gradingPeriodReference: {
          gradingPeriodDescriptor: `uri://ed-fi.org/GradingPeriodDescriptor#${grade.gradingPeriod?.name || 'Quarter'}`,
          periodSequence: 1,
          schoolId: grade.courseSection.school.schoolId,
          schoolYear
        },
        gradeTypeDescriptor: `uri://ed-fi.org/GradeTypeDescriptor#${grade.gradeType}`,
        numericGradeEarned: grade.numericGrade || undefined,
        letterGradeEarned: grade.letterGrade || undefined
      };

      await this.makeAuthenticatedRequest('POST', 'grades', edfiGrade);
      console.log(`Successfully synced grade for student ${grade.student.studentUniqueId}`);
    } catch (error) {
      console.error(`Failed to sync grade ${gradeId}:`, error);
      throw error;
    }
  }

  async syncAllStudents(): Promise<void> {
    try {
      const students = await prisma.student.findMany();
      console.log(`Syncing ${students.length} students to Ed-Fi...`);
      
      for (const student of students) {
        try {
          await this.syncStudent(student.id);
        } catch (error) {
          console.error(`Failed to sync student ${student.id}:`, error);
        }
      }
      
      console.log('Completed syncing students to Ed-Fi');
    } catch (error) {
      console.error('Failed to sync students:', error);
      throw error;
    }
  }

  async syncAllSchools(): Promise<void> {
    try {
      const schools = await prisma.school.findMany();
      console.log(`Syncing ${schools.length} schools to Ed-Fi...`);
      
      for (const school of schools) {
        try {
          await this.syncSchool(school.id);
        } catch (error) {
          console.error(`Failed to sync school ${school.id}:`, error);
        }
      }
      
      console.log('Completed syncing schools to Ed-Fi');
    } catch (error) {
      console.error('Failed to sync schools:', error);
      throw error;
    }
  }

  async syncAllCourses(): Promise<void> {
    try {
      const courses = await prisma.course.findMany();
      console.log(`Syncing ${courses.length} courses to Ed-Fi...`);
      
      for (const course of courses) {
        try {
          await this.syncCourse(course.id);
        } catch (error) {
          console.error(`Failed to sync course ${course.id}:`, error);
        }
      }
      
      console.log('Completed syncing courses to Ed-Fi');
    } catch (error) {
      console.error('Failed to sync courses:', error);
      throw error;
    }
  }

  async syncAllCourseSections(): Promise<void> {
    try {
      const sections = await prisma.courseSection.findMany();
      console.log(`Syncing ${sections.length} course sections to Ed-Fi...`);
      
      for (const section of sections) {
        try {
          await this.syncCourseSection(section.id);
        } catch (error) {
          console.error(`Failed to sync section ${section.id}:`, error);
        }
      }
      
      console.log('Completed syncing course sections to Ed-Fi');
    } catch (error) {
      console.error('Failed to sync course sections:', error);
      throw error;
    }
  }

  async syncAllGrades(): Promise<void> {
    try {
      const grades = await prisma.grade.findMany();
      console.log(`Syncing ${grades.length} grades to Ed-Fi...`);
      
      for (const grade of grades) {
        try {
          await this.syncGrade(grade.id);
        } catch (error) {
          console.error(`Failed to sync grade ${grade.id}:`, error);
        }
      }
      
      console.log('Completed syncing grades to Ed-Fi');
    } catch (error) {
      console.error('Failed to sync grades:', error);
      throw error;
    }
  }

  async syncAll(): Promise<void> {
    console.log('Starting full Ed-Fi synchronization...');
    
    try {
      await this.syncAllSchools();
      await this.syncAllStudents();
      await this.syncAllCourses();
      await this.syncAllCourseSections();
      await this.syncAllGrades();
      
      console.log('Full Ed-Fi synchronization completed successfully');
    } catch (error) {
      console.error('Full Ed-Fi synchronization failed:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      console.log('✅ Successfully obtained Ed-Fi access token');
      
      const schools = await this.makeAuthenticatedRequest('GET', 'schools');
      console.log(`✅ Successfully connected to Ed-Fi. Found ${schools.length || 0} schools.`);
      
      return true;
    } catch (error) {
      console.error('❌ Ed-Fi connection test failed:', error);
      return false;
    }
  }
}

export default new EdFiService();