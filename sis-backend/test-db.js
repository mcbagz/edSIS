const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testDB() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      }
    });
    
    console.log('Found users:', users);
    
    // Check for admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' }
    });
    
    if (adminUser) {
      console.log('Admin user found:', adminUser.email);
    } else {
      console.log('Admin user not found');
    }
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();