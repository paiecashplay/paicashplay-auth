const { PrismaClient } = require('@prisma/client');

async function addSchoolType() {
  const prisma = new PrismaClient();
  
  try {
    // Add school back to enum
    await prisma.$executeRaw`
      ALTER TABLE users 
      MODIFY COLUMN user_type ENUM('donor', 'federation', 'club', 'player', 'company', 'affiliate', 'academy', 'school', 'association')
    `;
    
    console.log('School user type added successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSchoolType();