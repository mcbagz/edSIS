const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkSchools() {
  try {
    const schools = await prisma.school.findMany();
    console.log('Schools in database:');
    schools.forEach(school => {
      console.log(`- ID: ${school.id}, SchoolId: ${school.schoolId}, Name: ${school.name}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchools();