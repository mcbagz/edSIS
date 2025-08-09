const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function debugLogin() {
  try {
    console.log('Testing login process...\n');
    
    const email = 'admin@school.edu';
    const password = 'admin123';
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        staff: true,
        parent: true,
      },
    });
    
    if (!user) {
      console.log('User not found!');
      return;
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hasPassword: !!user.password,
      passwordLength: user.password?.length,
    });
    
    console.log('\nPassword hash from DB:', user.password);
    
    // Test password
    const isValid = await bcrypt.compare(password, user.password);
    console.log('\nPassword comparison result:', isValid);
    
    if (!isValid) {
      // Generate correct hash
      const correctHash = await bcrypt.hash(password, 10);
      console.log('\nCorrect hash should be:', correctHash);
      
      // Update password
      await prisma.user.update({
        where: { email },
        data: { password: correctHash }
      });
      
      console.log('\nPassword updated! Try login again.');
    } else {
      console.log('\nPassword is correct! Login should work.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLogin();