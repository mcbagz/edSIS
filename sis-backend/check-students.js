const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkStudents() {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        studentUniqueId: true,
        firstName: true,
        lastName: true
      },
      take: 5
    });
    
    console.log('Student IDs in database:');
    students.forEach(student => {
      console.log(`ID: ${student.id}`);
      console.log(`  First 8 chars: ${student.id.substring(0, 8)}`);
      console.log(`  Student: ${student.firstName} ${student.lastName} (${student.studentUniqueId})\n`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudents();