const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    // Find admin users
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });
    
    console.log('Admin users in database:');
    admins.forEach(admin => {
      console.log(`- Email: ${admin.email}, Name: ${admin.firstName} ${admin.lastName}, Active: ${admin.isActive}`);
    });
    
    // Create a default admin if none exists
    if (admins.length === 0) {
      console.log('\nNo admin users found. Creating default admin...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@school.com',
          password: hashedPassword,
          role: 'ADMIN',
          firstName: 'System',
          lastName: 'Administrator',
          isActive: true
        }
      });
      
      console.log('Created admin user:');
      console.log(`- Email: ${newAdmin.email}`);
      console.log(`- Password: admin123`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();