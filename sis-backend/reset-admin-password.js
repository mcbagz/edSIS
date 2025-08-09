const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const updated = await prisma.user.update({
      where: { email: 'admin@school.edu' },
      data: {
        password: hashedPassword,
        isActive: true
      }
    });
    
    console.log('Admin password reset successfully!');
    console.log('Email: admin@school.edu');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();