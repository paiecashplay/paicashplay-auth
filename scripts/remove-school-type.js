const { PrismaClient } = require('@prisma/client');

async function removeSchoolType() {
  const prisma = new PrismaClient();
  
  try {
    // Update enum to remove school
    await prisma.$executeRaw`
      ALTER TABLE users 
      MODIFY COLUMN user_type ENUM('donor', 'federation', 'club', 'player', 'company', 'affiliate', 'academy', 'association')
    `;
    
    console.log('School user type removed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeSchoolType();