const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testUpsert() {
  try {
    console.log('Testing grade upsert...\n');
    
    // Get a valid student, course section, and assignment
    const enrollment = await prisma.enrollment.findFirst({
      include: {
        student: true,
        courseSection: {
          include: {
            assignments: true
          }
        }
      }
    });
    
    if (!enrollment || enrollment.courseSection.assignments.length === 0) {
      console.log('No valid enrollment with assignments found');
      return;
    }
    
    const studentId = enrollment.studentId;
    const courseSectionId = enrollment.courseSectionId;
    const assignmentId = enrollment.courseSection.assignments[0].id;
    
    console.log('Test data:');
    console.log('Student:', enrollment.student.firstName, enrollment.student.lastName);
    console.log('Course Section:', courseSectionId);
    console.log('Assignment:', enrollment.courseSection.assignments[0].title);
    console.log('');
    
    // Try to upsert a grade
    console.log('Attempting upsert...');
    const grade = await prisma.grade.upsert({
      where: {
        studentId_courseSectionId_assignmentId: {
          studentId,
          courseSectionId,
          assignmentId
        }
      },
      update: {
        points: 85,
        numericGrade: 85,
        letterGrade: 'B'
      },
      create: {
        studentId,
        courseSectionId,
        assignmentId,
        gradeType: 'Assignment',
        points: 85,
        numericGrade: 85,
        letterGrade: 'B'
      }
    });
    
    console.log('Upsert successful!');
    console.log('Grade ID:', grade.id);
    console.log('Points:', grade.points);
    
  } catch (error) {
    console.error('Error details:');
    console.error('Message:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.meta) {
      console.error('Meta:', error.meta);
    }
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpsert();