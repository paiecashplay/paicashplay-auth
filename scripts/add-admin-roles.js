const { PrismaClient } = require('@prisma/client');

async function addAdminRoles() {
  const prisma = new PrismaClient();
  
  try {
    // Add columns manually via raw SQL
    try {
      await prisma.$executeRaw`
        ALTER TABLE admin_users 
        ADD COLUMN role ENUM('SUPER_ADMIN', 'ADMIN', 'SERVICE_ADMIN') DEFAULT 'ADMIN' AFTER full_name
      `;
    } catch (e) { console.log('Role column may already exist'); }
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE admin_users 
        ADD COLUMN allowed_services JSON NULL AFTER role
      `;
    } catch (e) { console.log('Services column may already exist'); }
    
    // Update existing admin to super_admin
    await prisma.$executeRaw`
      UPDATE admin_users SET role = 'SUPER_ADMIN' WHERE username = 'admin'
    `;
    
    console.log('Admin roles added successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAdminRoles();