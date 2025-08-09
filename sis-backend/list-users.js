const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true
      },
      orderBy: { role: 'asc' }
    });
    
    console.log('Users in the system:\n');
    console.log('ADMIN Users:');
    users.filter(u => u.role === 'ADMIN').forEach(user => {
      console.log(`  Email: ${user.email} | Name: ${user.firstName} ${user.lastName} | Active: ${user.isActive}`);
    });
    
    console.log('\nTEACHER Users:');
    users.filter(u => u.role === 'TEACHER').forEach(user => {
      console.log(`  Email: ${user.email} | Name: ${user.firstName} ${user.lastName} | Active: ${user.isActive}`);
    });
    
    console.log('\nSTUDENT Users:');
    users.filter(u => u.role === 'STUDENT').forEach(user => {
      console.log(`  Email: ${user.email} | Name: ${user.firstName} ${user.lastName} | Active: ${user.isActive}`);
    });
    
    console.log('\nPARENT Users:');
    users.filter(u => u.role === 'PARENT').forEach(user => {
      console.log(`  Email: ${user.email} | Name: ${user.firstName} ${user.lastName} | Active: ${user.isActive}`);
    });
    
    // Reset passwords for a few test users
    console.log('\n-------------------------------------------');
    console.log('Setting passwords for test accounts:');
    console.log('-------------------------------------------');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Update a teacher account
    const teacher = await prisma.user.findFirst({
      where: { role: 'TEACHER' }
    });
    if (teacher) {
      await prisma.user.update({
        where: { id: teacher.id },
        data: { password: hashedPassword }
      });
      console.log(`Teacher: ${teacher.email} | Password: password123`);
    }
    
    // Update a student account
    const student = await prisma.user.findFirst({
      where: { role: 'STUDENT' }
    });
    if (student) {
      await prisma.user.update({
        where: { id: student.id },
        data: { password: hashedPassword }
      });
      console.log(`Student: ${student.email} | Password: password123`);
    }
    
    console.log(`Admin: admin@school.edu | Password: admin123`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();