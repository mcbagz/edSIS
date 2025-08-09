import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@school.edu',
      password: adminPassword,
      role: 'ADMIN',
      firstName: 'System',
      lastName: 'Administrator',
    },
  });

  // Create a school
  const school = await prisma.school.create({
    data: {
      schoolId: 1001,
      name: 'Lincoln High School',
      type: 'High',
      address: '123 Education Blvd',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      phone: '(555) 123-4567',
      principal: 'Dr. Jane Smith',
    },
  });

  // Create a session (current academic year)
  const currentSession = await prisma.session.create({
    data: {
      schoolId: school.id,
      name: 'Fall 2024',
      beginDate: new Date('2024-08-15'),
      endDate: new Date('2024-12-20'),
      totalInstructionalDays: 90,
    },
  });

  // Create grading periods
  const gradingPeriod1 = await prisma.gradingPeriod.create({
    data: {
      sessionId: currentSession.id,
      schoolId: school.id,
      name: 'Quarter 1',
      beginDate: new Date('2024-08-15'),
      endDate: new Date('2024-10-15'),
    },
  });

  const gradingPeriod2 = await prisma.gradingPeriod.create({
    data: {
      sessionId: currentSession.id,
      schoolId: school.id,
      name: 'Quarter 2',
      beginDate: new Date('2024-10-16'),
      endDate: new Date('2024-12-20'),
    },
  });

  // Create sample teacher account
  const sampleTeacherPassword = await bcrypt.hash('teacher123', 10);
  const sampleTeacherUser = await prisma.user.create({
    data: {
      email: 'teacher@school.edu',
      password: sampleTeacherPassword,
      role: 'TEACHER',
      firstName: 'Teacher',
      lastName: 'User',
    },
  });

  const sampleTeacher = await prisma.staff.create({
    data: {
      userId: sampleTeacherUser.id,
      staffUniqueId: 'STAFF_SAMPLE',
      firstName: 'Teacher',
      lastName: 'User',
      email: 'teacher@school.edu',
      position: 'Teacher',
      department: 'General',
      hireDate: new Date('2020-08-01'),
    },
  });

  // Create a teacher
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teacherUser = await prisma.user.create({
    data: {
      email: 'john.doe@school.edu',
      password: teacherPassword,
      role: 'TEACHER',
      firstName: 'John',
      lastName: 'Doe',
    },
  });

  const teacher = await prisma.staff.create({
    data: {
      userId: teacherUser.id,
      staffUniqueId: 'STAFF001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@school.edu',
      position: 'Mathematics Teacher',
      department: 'Mathematics',
      hireDate: new Date('2020-08-01'),
    },
  });

  // Create another teacher for homeroom
  const teacher2Password = await bcrypt.hash('teacher123', 10);
  const teacher2User = await prisma.user.create({
    data: {
      email: 'sarah.johnson@school.edu',
      password: teacher2Password,
      role: 'TEACHER',
      firstName: 'Sarah',
      lastName: 'Johnson',
    },
  });

  const teacher2 = await prisma.staff.create({
    data: {
      userId: teacher2User.id,
      staffUniqueId: 'STAFF002',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@school.edu',
      position: 'English Teacher',
      department: 'English',
      hireDate: new Date('2019-08-01'),
    },
  });

  // Create homerooms
  const homeroom9A = await prisma.homeroom.create({
    data: {
      schoolId: school.id,
      name: '9A',
      teacherId: teacher2.id,
      roomNumber: '101',
      capacity: 30,
      gradeLevel: '9',
    },
  });

  const homeroom9B = await prisma.homeroom.create({
    data: {
      schoolId: school.id,
      name: '9B',
      teacherId: teacher.id,
      roomNumber: '102',
      capacity: 30,
      gradeLevel: '9',
    },
  });

  // Create courses
  const mathCourse = await prisma.course.create({
    data: {
      schoolId: school.id,
      courseCode: 'MATH101',
      name: 'Algebra I',
      description: 'Introduction to algebraic concepts and problem solving',
      credits: 1.0,
      department: 'Mathematics',
      gradeLevel: ['9', '10'],
      prerequisites: [],
      capacity: 30,
    },
  });

  const englishCourse = await prisma.course.create({
    data: {
      schoolId: school.id,
      courseCode: 'ENG101',
      name: 'English I',
      description: 'Freshman English focusing on literature and composition',
      credits: 1.0,
      department: 'English',
      gradeLevel: ['9'],
      prerequisites: [],
      capacity: 30,
    },
  });

  const scienceCourse = await prisma.course.create({
    data: {
      schoolId: school.id,
      courseCode: 'SCI101',
      name: 'Biology',
      description: 'Introduction to biological sciences',
      credits: 1.0,
      department: 'Science',
      gradeLevel: ['9', '10'],
      prerequisites: [],
      capacity: 25,
    },
  });

  // Create course sections
  const mathSectionA = await prisma.courseSection.create({
    data: {
      courseId: mathCourse.id,
      schoolId: school.id,
      sessionId: currentSession.id,
      sectionIdentifier: 'A',
      teacherId: teacher.id,
      roomNumber: '201',
      period: '1st Period',
      time: '8:00 AM - 8:50 AM',
      days: ['M', 'W', 'F'],
      maxStudents: 30,
    },
  });

  const englishSectionA = await prisma.courseSection.create({
    data: {
      courseId: englishCourse.id,
      schoolId: school.id,
      sessionId: currentSession.id,
      sectionIdentifier: 'A',
      teacherId: teacher2.id,
      roomNumber: '301',
      period: '2nd Period',
      time: '9:00 AM - 9:50 AM',
      days: ['M', 'W', 'F'],
      maxStudents: 30,
    },
  });

  // Create prospective students with applications
  const prospectiveStudent1 = await prisma.prospectiveStudent.create({
    data: {
      firstName: 'Emily',
      lastName: 'Williams',
      dateOfBirth: new Date('2009-03-15'),
      gender: 'Female',
      ethnicity: 'Caucasian',
      email: 'emily.williams@example.com',
      phone: '(555) 234-5678',
      address: '456 Oak Street',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      guardianName: 'Robert Williams',
      guardianEmail: 'robert.williams@example.com',
      guardianPhone: '(555) 234-5679',
      guardianRelation: 'Father',
    },
  });

  const application1 = await prisma.application.create({
    data: {
      prospectiveStudentId: prospectiveStudent1.id,
      status: 'APPLIED',
      notes: 'Strong academic record, interested in STEM programs',
      documents: {
        transcripts: 's3://bucket/applications/emily-williams/transcript.pdf',
        recommendations: ['s3://bucket/applications/emily-williams/rec1.pdf'],
      },
    },
  });

  const prospectiveStudent2 = await prisma.prospectiveStudent.create({
    data: {
      firstName: 'Michael',
      lastName: 'Brown',
      dateOfBirth: new Date('2009-07-22'),
      gender: 'Male',
      ethnicity: 'African American',
      email: 'michael.brown@example.com',
      phone: '(555) 345-6789',
      address: '789 Elm Avenue',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62702',
      guardianName: 'Lisa Brown',
      guardianEmail: 'lisa.brown@example.com',
      guardianPhone: '(555) 345-6790',
      guardianRelation: 'Mother',
    },
  });

  const application2 = await prisma.application.create({
    data: {
      prospectiveStudentId: prospectiveStudent2.id,
      status: 'APPLIED',
      notes: 'Excellent athlete, interested in joining basketball team',
      documents: {
        transcripts: 's3://bucket/applications/michael-brown/transcript.pdf',
        athleticRecords: 's3://bucket/applications/michael-brown/athletic.pdf',
      },
    },
  });

  // Create an accepted application that's ready for enrollment
  const prospectiveStudent3 = await prisma.prospectiveStudent.create({
    data: {
      firstName: 'Sarah',
      lastName: 'Davis',
      dateOfBirth: new Date('2009-01-10'),
      gender: 'Female',
      ethnicity: 'Hispanic',
      email: 'sarah.davis@example.com',
      phone: '(555) 456-7890',
      address: '321 Pine Street',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62703',
      guardianName: 'Maria Davis',
      guardianEmail: 'maria.davis@example.com',
      guardianPhone: '(555) 456-7891',
      guardianRelation: 'Mother',
    },
  });

  const application3 = await prisma.application.create({
    data: {
      prospectiveStudentId: prospectiveStudent3.id,
      status: 'ACCEPTED',
      notes: 'Outstanding application, accepted for Fall 2024',
      reviewedBy: adminUser.id,
      reviewedAt: new Date(),
      documents: {
        transcripts: 's3://bucket/applications/sarah-davis/transcript.pdf',
        recommendations: [
          's3://bucket/applications/sarah-davis/rec1.pdf',
          's3://bucket/applications/sarah-davis/rec2.pdf',
        ],
      },
    },
  });

  // Create sample parent account
  const sampleParentPassword = await bcrypt.hash('parent123', 10);
  const sampleParentUser = await prisma.user.create({
    data: {
      email: 'parent@school.edu',
      password: sampleParentPassword,
      role: 'PARENT',
      firstName: 'Parent',
      lastName: 'User',
    },
  });

  const sampleParent = await prisma.parent.create({
    data: {
      userId: sampleParentUser.id,
      firstName: 'Parent',
      lastName: 'User',
      email: 'parent@school.edu',
      phoneNumber: '(555) 111-2222',
      address: '123 Parent Street',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
    },
  });

  // Create sample student account
  const sampleStudentPassword = await bcrypt.hash('student123', 10);
  const sampleStudentUser = await prisma.user.create({
    data: {
      email: 'student@school.edu',
      password: sampleStudentPassword,
      role: 'STUDENT',
      firstName: 'Student',
      lastName: 'User',
    },
  });

  const sampleStudent = await prisma.student.create({
    data: {
      userId: sampleStudentUser.id,
      studentUniqueId: 'STU_SAMPLE',
      firstName: 'Student',
      lastName: 'User',
      birthDate: new Date('2008-01-01'),
      gender: 'Male',
      gradeLevel: '9',
      email: 'student@school.edu',
      phone: '(555) 111-3333',
      address: '456 Student Avenue',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
    },
  });

  // Link sample parent to sample student
  await prisma.studentParent.create({
    data: {
      studentId: sampleStudent.id,
      parentId: sampleParent.id,
      relationship: 'Parent',
      isPrimary: true,
    },
  });

  // Enroll sample student in homeroom and courses
  await prisma.enrollment.create({
    data: {
      studentId: sampleStudent.id,
      homeroomId: homeroom9A.id,
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: sampleStudent.id,
      courseSectionId: mathSectionA.id,
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: sampleStudent.id,
      courseSectionId: englishSectionA.id,
    },
  });

  console.log('Seed completed successfully!');
  console.log({
    school: school.name,
    users: {
      admin: adminUser.email,
      teacher: sampleTeacherUser.email,
      parent: sampleParentUser.email,
      student: sampleStudentUser.email,
    },
    otherTeachers: [teacherUser.email, teacher2User.email],
    homerooms: [homeroom9A.name, homeroom9B.name],
    courses: [mathCourse.name, englishCourse.name, scienceCourse.name],
    prospectiveStudents: 3,
    applications: {
      applied: 2,
      accepted: 1,
    },
  });
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });