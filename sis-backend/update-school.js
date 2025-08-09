const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function updateSchool() {
  try {
    const school = await prisma.school.update({
      where: { schoolId: 1001 },
      data: { 
        schoolId: 255901001, 
        name: 'Grand Bend High School',
        type: 'High'
      }
    });
    console.log('Updated school:', school);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSchool();