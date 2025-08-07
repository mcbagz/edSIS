import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting test data seeding...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('Clearing existing test data...');
  
  // Delete in correct order to respect foreign key constraints
  await prisma.grade.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.studentDisciplineIncident.deleteMany({});
  await prisma.studentParent.deleteMany({});
  await prisma.courseSection.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.homeroom.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.parent.deleteMany({});
  await prisma.user.deleteMany({ where: { role: { in: ['STUDENT', 'TEACHER', 'PARENT'] } } });

  // Create a school if it doesn't exist
  const school = await prisma.school.upsert({
    where: { schoolId: 1001 },
    update: {},
    create: {
      schoolId: 1001,
      name: 'Lincoln High School',
      type: 'High School',
      address: '123 Education Blvd',
      city: 'Learning City',
      state: 'CA',
      zipCode: '90210',
      phone: '555-0100',
      principal: 'Dr. Sarah Johnson'
    }
  });

  // Create a session and grading periods
  const session = await prisma.session.upsert({
    where: { id: 'session-2024-2025' },
    update: {},
    create: {
      id: 'session-2024-2025',
      schoolId: school.id,
      name: '2024-2025 School Year',
      beginDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-15'),
      totalInstructionalDays: 180
    }
  });

  const gradingPeriods = await Promise.all([
    prisma.gradingPeriod.upsert({
      where: { id: 'q1-2024' },
      update: {},
      create: {
        id: 'q1-2024',
        sessionId: session.id,
        schoolId: school.id,
        name: 'Quarter 1',
        beginDate: new Date('2024-09-01'),
        endDate: new Date('2024-11-08')
      }
    }),
    prisma.gradingPeriod.upsert({
      where: { id: 'q2-2024' },
      update: {},
      create: {
        id: 'q2-2024',
        sessionId: session.id,
        schoolId: school.id,
        name: 'Quarter 2',
        beginDate: new Date('2024-11-09'),
        endDate: new Date('2025-01-24')
      }
    })
  ]);

  // Create 5 teachers
  const teacherData = [
    { firstName: 'Robert', lastName: 'Anderson', email: 'r.anderson@school.edu', position: 'Math Teacher', department: 'Mathematics' },
    { firstName: 'Jennifer', lastName: 'Martinez', email: 'j.martinez@school.edu', position: 'Science Teacher', department: 'Science' },
    { firstName: 'Michael', lastName: 'Thompson', email: 'm.thompson@school.edu', position: 'English Teacher', department: 'English' },
    { firstName: 'Emily', lastName: 'Davis', email: 'e.davis@school.edu', position: 'History Teacher', department: 'Social Studies' },
    { firstName: 'David', lastName: 'Wilson', email: 'd.wilson@school.edu', position: 'Computer Science Teacher', department: 'Technology' }
  ];

  const hashedPassword = await bcrypt.hash('password123', 10);
  const teachers = [];

  for (let i = 0; i < teacherData.length; i++) {
    const teacher = teacherData[i];
    const user = await prisma.user.create({
      data: {
        email: teacher.email,
        password: hashedPassword,
        role: 'TEACHER',
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        isActive: true
      }
    });

    const staff = await prisma.staff.create({
      data: {
        userId: user.id,
        staffUniqueId: `T${1000 + i}`,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        phone: `555-020${i}`,
        position: teacher.position,
        department: teacher.department,
        hireDate: new Date('2020-08-01')
      }
    });

    teachers.push(staff);
  }

  console.log(`✅ Created ${teachers.length} teachers`);

  // Create 20 students
  const studentData = [
    { firstName: 'Emma', lastName: 'Johnson', grade: '9', gender: 'Female', ethnicity: 'Caucasian' },
    { firstName: 'Liam', lastName: 'Smith', grade: '9', gender: 'Male', ethnicity: 'Caucasian' },
    { firstName: 'Olivia', lastName: 'Brown', grade: '9', gender: 'Female', ethnicity: 'Hispanic' },
    { firstName: 'Noah', lastName: 'Jones', grade: '10', gender: 'Male', ethnicity: 'African American' },
    { firstName: 'Ava', lastName: 'Garcia', grade: '10', gender: 'Female', ethnicity: 'Hispanic' },
    { firstName: 'Elijah', lastName: 'Miller', grade: '10', gender: 'Male', ethnicity: 'Caucasian' },
    { firstName: 'Sophia', lastName: 'Rodriguez', grade: '11', gender: 'Female', ethnicity: 'Hispanic' },
    { firstName: 'Lucas', lastName: 'Martinez', grade: '11', gender: 'Male', ethnicity: 'Hispanic' },
    { firstName: 'Mia', lastName: 'Hernandez', grade: '11', gender: 'Female', ethnicity: 'Hispanic' },
    { firstName: 'Mason', lastName: 'Lopez', grade: '12', gender: 'Male', ethnicity: 'Hispanic' },
    { firstName: 'Isabella', lastName: 'Gonzalez', grade: '12', gender: 'Female', ethnicity: 'Hispanic' },
    { firstName: 'Ethan', lastName: 'Wilson', grade: '12', gender: 'Male', ethnicity: 'Caucasian' },
    { firstName: 'Charlotte', lastName: 'Anderson', grade: '9', gender: 'Female', ethnicity: 'Caucasian' },
    { firstName: 'Aiden', lastName: 'Thomas', grade: '10', gender: 'Male', ethnicity: 'African American' },
    { firstName: 'Amelia', lastName: 'Taylor', grade: '11', gender: 'Female', ethnicity: 'Caucasian' },
    { firstName: 'James', lastName: 'Moore', grade: '12', gender: 'Male', ethnicity: 'Caucasian' },
    { firstName: 'Harper', lastName: 'Jackson', grade: '9', gender: 'Female', ethnicity: 'African American' },
    { firstName: 'Benjamin', lastName: 'Martin', grade: '10', gender: 'Male', ethnicity: 'Asian' },
    { firstName: 'Evelyn', lastName: 'Lee', grade: '11', gender: 'Female', ethnicity: 'Asian' },
    { firstName: 'William', lastName: 'Perez', grade: '12', gender: 'Male', ethnicity: 'Hispanic' }
  ];

  const students = [];

  for (let i = 0; i < studentData.length; i++) {
    const student = studentData[i];
    const user = await prisma.user.create({
      data: {
        email: `${student.firstName.toLowerCase()}.${student.lastName.toLowerCase()}@student.edu`,
        password: hashedPassword,
        role: 'STUDENT',
        firstName: student.firstName,
        lastName: student.lastName,
        isActive: true
      }
    });

    const createdStudent = await prisma.student.create({
      data: {
        userId: user.id,
        studentUniqueId: `S${2000 + i}`,
        firstName: student.firstName,
        lastName: student.lastName,
        middleName: '',
        birthDate: new Date(`${2024 - parseInt(student.grade) - 14}-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`),
        gender: student.gender,
        ethnicity: student.ethnicity,
        gradeLevel: student.grade,
        enrollmentDate: new Date('2024-09-01'),
        enrollmentStatus: 'Active',
        email: `${student.firstName.toLowerCase()}.${student.lastName.toLowerCase()}@student.edu`,
        phone: `555-030${i}`,
        address: `${100 + i} Main Street`,
        city: 'Learning City',
        state: 'CA',
        zipCode: '90210',
        emergencyContactName: `Parent of ${student.firstName}`,
        emergencyContactPhone: `555-040${i}`,
        emergencyContactRelation: 'Parent'
      }
    });

    students.push(createdStudent);
  }

  console.log(`✅ Created ${students.length} students`);

  // Create 10 courses (2 per teacher)
  const coursesData = [
    // Math courses
    { code: 'MATH101', name: 'Algebra I', teacherId: teachers[0].id, credits: 1.0, department: 'Mathematics', gradeLevel: ['9', '10'] },
    { code: 'MATH201', name: 'Geometry', teacherId: teachers[0].id, credits: 1.0, department: 'Mathematics', gradeLevel: ['10', '11'] },
    
    // Science courses
    { code: 'SCI101', name: 'Biology', teacherId: teachers[1].id, credits: 1.0, department: 'Science', gradeLevel: ['9', '10'] },
    { code: 'SCI201', name: 'Chemistry', teacherId: teachers[1].id, credits: 1.0, department: 'Science', gradeLevel: ['10', '11', '12'] },
    
    // English courses
    { code: 'ENG101', name: 'English Literature I', teacherId: teachers[2].id, credits: 1.0, department: 'English', gradeLevel: ['9', '10'] },
    { code: 'ENG201', name: 'Creative Writing', teacherId: teachers[2].id, credits: 1.0, department: 'English', gradeLevel: ['11', '12'] },
    
    // History courses
    { code: 'HIST101', name: 'World History', teacherId: teachers[3].id, credits: 1.0, department: 'Social Studies', gradeLevel: ['9', '10'] },
    { code: 'HIST201', name: 'US History', teacherId: teachers[3].id, credits: 1.0, department: 'Social Studies', gradeLevel: ['11', '12'] },
    
    // Computer Science courses
    { code: 'CS101', name: 'Introduction to Programming', teacherId: teachers[4].id, credits: 1.0, department: 'Technology', gradeLevel: ['9', '10', '11', '12'] },
    { code: 'CS201', name: 'Web Development', teacherId: teachers[4].id, credits: 1.0, department: 'Technology', gradeLevel: ['10', '11', '12'] }
  ];

  const courses = [];
  const courseSections = [];

  for (const courseData of coursesData) {
    const course = await prisma.course.create({
      data: {
        schoolId: school.id,
        courseCode: courseData.code,
        name: courseData.name,
        description: `${courseData.name} course for high school students`,
        credits: courseData.credits,
        department: courseData.department,
        gradeLevel: courseData.gradeLevel,
        prerequisites: [],
        capacity: 30
      }
    });

    // Create a section for each course
    const section = await prisma.courseSection.create({
      data: {
        courseId: course.id,
        schoolId: school.id,
        sessionId: session.id,
        sectionIdentifier: 'A',
        teacherId: courseData.teacherId,
        roomNumber: `${Math.floor(Math.random() * 300) + 100}`,
        period: `${courses.length + 1}`,
        time: `${8 + Math.floor(courses.length / 2)}:${courses.length % 2 === 0 ? '00' : '30'} AM - ${8 + Math.floor(courses.length / 2)}:${courses.length % 2 === 0 ? '50' : '20'} AM`,
        days: ['M', 'T', 'W', 'Th', 'F'],
        maxStudents: 30,
        currentEnrollment: 0
      }
    });

    courses.push(course);
    courseSections.push(section);
  }

  console.log(`✅ Created ${courses.length} courses with sections`);

  // Enroll students in courses (5-10 students per course)
  let enrollmentCount = 0;
  for (let i = 0; i < courseSections.length; i++) {
    const section = courseSections[i];
    const course = courses[i];
    
    // Get eligible students based on grade level
    const eligibleStudents = students.filter(s => 
      course.gradeLevel.includes(s.gradeLevel)
    );
    
    // Randomly select 5-10 students
    const numStudents = Math.floor(Math.random() * 6) + 5; // 5-10 students
    const shuffled = eligibleStudents.sort(() => 0.5 - Math.random());
    const selectedStudents = shuffled.slice(0, Math.min(numStudents, eligibleStudents.length));
    
    for (const student of selectedStudents) {
      // Check if student is already enrolled in this section
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseSectionId: {
            studentId: student.id,
            courseSectionId: section.id
          }
        }
      });

      if (!existingEnrollment) {
        await prisma.enrollment.create({
          data: {
            studentId: student.id,
            courseSectionId: section.id,
            enrollmentDate: new Date('2024-09-01'),
            status: 'Active'
          }
        });
        enrollmentCount++;

        // Update section enrollment count
        await prisma.courseSection.update({
          where: { id: section.id },
          data: { currentEnrollment: { increment: 1 } }
        });
      }
    }
  }

  console.log(`✅ Created ${enrollmentCount} enrollments`);

  // Create some sample assignments and grades for each course section
  let assignmentCount = 0;
  let gradeCount = 0;

  for (const section of courseSections) {
    // Create 3-5 assignments per section
    const assignments = [];
    const assignmentTypes = [
      { type: 'Homework', category: 'Homework', weight: 0.2, maxPoints: 10 },
      { type: 'Quiz', category: 'Quizzes', weight: 0.3, maxPoints: 25 },
      { type: 'Test', category: 'Tests', weight: 0.4, maxPoints: 100 },
      { type: 'Project', category: 'Projects', weight: 0.1, maxPoints: 50 }
    ];

    for (let i = 0; i < 4; i++) {
      const assignmentType = assignmentTypes[i];
      const assignment = await prisma.assignment.create({
        data: {
          courseSectionId: section.id,
          title: `${assignmentType.type} ${i + 1}`,
          description: `${assignmentType.type} assignment for the course`,
          type: assignmentType.type,
          dueDate: new Date(`2024-${10 + Math.floor(i / 2)}-${(i % 2) * 15 + 10}`),
          maxPoints: assignmentType.maxPoints,
          weight: assignmentType.weight,
          category: assignmentType.category
        }
      });
      assignments.push(assignment);
      assignmentCount++;
    }

    // Create grades for enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseSectionId: section.id,
        status: 'Active'
      }
    });

    for (const enrollment of enrollments) {
      for (const assignment of assignments) {
        // Generate a random grade (70-100% range for most students)
        const percentage = Math.random() * 30 + 70;
        const points = (percentage / 100) * assignment.maxPoints;
        const letterGrade = getLetterGrade(percentage);

        await prisma.grade.create({
          data: {
            studentId: enrollment.studentId,
            courseSectionId: section.id,
            assignmentId: assignment.id,
            gradingPeriodId: gradingPeriods[0].id,
            gradeType: 'Assignment',
            numericGrade: percentage,
            letterGrade: letterGrade,
            points: points
          }
        });
        gradeCount++;
      }
    }
  }

  console.log(`✅ Created ${assignmentCount} assignments`);
  console.log(`✅ Created ${gradeCount} grades`);

  // Create some attendance records for the past week
  let attendanceCount = 0;
  const today = new Date();
  const attendanceCodes = ['Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Absent', 'Tardy', 'Excused'];

  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const student of students) {
      const code = attendanceCodes[Math.floor(Math.random() * attendanceCodes.length)];
      
      await prisma.attendance.create({
        data: {
          studentId: student.id,
          date: date,
          attendanceCode: code,
          minutes: code === 'Present' ? 480 : code === 'Tardy' ? 450 : 0
        }
      });
      attendanceCount++;
    }
  }

  console.log(`✅ Created ${attendanceCount} attendance records`);

  console.log('\n📊 Test Data Summary:');
  console.log(`   - Teachers: ${teachers.length}`);
  console.log(`   - Students: ${students.length}`);
  console.log(`   - Courses: ${courses.length}`);
  console.log(`   - Course Sections: ${courseSections.length}`);
  console.log(`   - Enrollments: ${enrollmentCount}`);
  console.log(`   - Assignments: ${assignmentCount}`);
  console.log(`   - Grades: ${gradeCount}`);
  console.log(`   - Attendance Records: ${attendanceCount}`);
  
  console.log('\n🔑 Login Credentials:');
  console.log('   Teachers:');
  teacherData.forEach(teacher => {
    console.log(`     - ${teacher.email} / password123`);
  });
  console.log('\n   Sample Students:');
  console.log(`     - emma.johnson@student.edu / password123`);
  console.log(`     - liam.smith@student.edu / password123`);
  console.log(`     - olivia.brown@student.edu / password123`);
}

function getLetterGrade(percentage: number): string {
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}

main()
  .catch((e) => {
    console.error('❌ Error seeding test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });