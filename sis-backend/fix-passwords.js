const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixPasswords() {
  try {
    console.log('Updating passwords for all users...\n');
    
    // Define users and their passwords
    const users = [
      { email: 'admin@school.edu', password: 'admin123' },
      { email: 'teacher@school.edu', password: 'teacher123' },
      { email: 'parent@school.edu', password: 'parent123' },
      { email: 'student@school.edu', password: 'student123' },
    ];
    
    for (const userData of users) {
      const hash = await bcrypt.hash(userData.password, 10);
      
      try {
        await prisma.user.update({
          where: { email: userData.email },
          data: { password: hash }
        });
        console.log(`✓ Updated password for ${userData.email}`);
      } catch (err) {
        console.log(`✗ User ${userData.email} not found`);
      }
    }
    
    // Also create enrollments and assignments for testing
    console.log('\nChecking course sections...');
    const courseSections = await prisma.courseSection.findMany({
      include: {
        teacher: true,
        course: true,
        enrollments: true
      }
    });
    
    console.log(`Found ${courseSections.length} course sections`);
    
    if (courseSections.length > 0) {
      const firstSection = courseSections[0];
      console.log(`\nFirst section: ${firstSection.course.name} (${firstSection.id})`);
      console.log(`Teacher: ${firstSection.teacher.firstName} ${firstSection.teacher.lastName}`);
      console.log(`Current enrollments: ${firstSection.enrollments.length}`);
      
      // If no enrollments, create some
      if (firstSection.enrollments.length === 0) {
        console.log('\nCreating test enrollments...');
        const students = await prisma.student.findMany({ take: 5 });
        
        for (const student of students) {
          await prisma.enrollment.create({
            data: {
              studentId: student.id,
              courseSectionId: firstSection.id,
              enrollmentDate: new Date(),
              status: 'Active'
            }
          });
          console.log(`✓ Enrolled ${student.firstName} ${student.lastName}`);
        }
      }
      
      // Check for assignments
      const assignments = await prisma.assignment.findMany({
        where: { courseSectionId: firstSection.id }
      });
      
      console.log(`\nAssignments in first section: ${assignments.length}`);
      
      if (assignments.length === 0) {
        console.log('Creating test assignments...');
        const newAssignments = [
          { title: 'Homework 1', type: 'Homework', category: 'Homework', maxPoints: 100, weight: 1 },
          { title: 'Quiz 1', type: 'Quiz', category: 'Quiz', maxPoints: 50, weight: 1.5 },
          { title: 'Test 1', type: 'Test', category: 'Test', maxPoints: 100, weight: 2 },
        ];
        
        for (const assignment of newAssignments) {
          await prisma.assignment.create({
            data: {
              ...assignment,
              courseSectionId: firstSection.id,
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
            }
          });
          console.log(`✓ Created ${assignment.title}`);
        }
      }
    }
    
    console.log('\nDone!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPasswords();