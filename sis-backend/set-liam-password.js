const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setLiamPassword() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = await prisma.user.findFirst({
      where: { email: 'liam.smith@student.edu' }
    });
    
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      console.log('Password updated for Liam Smith');
      console.log('Email: liam.smith@student.edu');
      console.log('Password: password123');
    } else {
      console.log('User not found: liam.smith@student.edu');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setLiamPassword();