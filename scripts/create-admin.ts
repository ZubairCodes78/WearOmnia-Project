import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'admin@wearomnia.com';
  const password = 'WearOMNIA2026!'; // Change this to a secure password
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Create admin user
  const admin = await prisma.admin.upsert({
    where: { email },
    update: { password: hashedPassword },
    create: {
      email,
      password: hashedPassword,
      name: 'WearOMNIA Admin',
    },
  });
  
  console.log('Admin user created/updated:', admin.email);
  console.log('Password:', password);
  console.log('IMPORTANT: Change this password after first login!');
}

createAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });