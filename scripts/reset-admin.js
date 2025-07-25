const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdmin() {
  try {
    console.log('🔄 Resetting admin password...');
    
    // Hash the password with same method as in the app
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash('password', saltRounds);
    
    // Update or create admin
    const admin = await prisma.adminUser.upsert({
      where: { username: 'admin' },
      update: {
        passwordHash,
        email: 'admin@paiecashplay.com',
        fullName: 'Administrateur Principal',
        isActive: true
      },
      create: {
        username: 'admin',
        passwordHash,
        email: 'admin@paiecashplay.com',
        fullName: 'Administrateur Principal',
        isActive: true
      }
    });
    
    console.log('✅ Admin password reset successfully!');
    console.log('Username: admin');
    console.log('Password: password');
    console.log('Admin ID:', admin.id);
    
    // Test the hash
    const isValid = await bcrypt.compare('password', passwordHash);
    console.log('Password hash test:', isValid ? '✅ Valid' : '❌ Invalid');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();