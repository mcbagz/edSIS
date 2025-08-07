import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔑 Creating admin user...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create or update admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@school.edu' },
    update: {
      password: hashedPassword,
      isActive: true
    },
    create: {
      email: 'admin@school.edu',
      password: hashedPassword,
      role: 'ADMIN',
      firstName: 'System',
      lastName: 'Administrator',
      isActive: true
    }
  });

  console.log('✅ Admin user created/updated:');
  console.log('   Email: admin@school.edu');
  console.log('   Password: admin123');
  console.log('   Role: ADMIN');
}

main()
  .catch((e) => {
    console.error('❌ Error creating admin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });