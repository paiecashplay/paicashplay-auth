const { PrismaClient } = require('@prisma/client');

async function addNewUserTypes() {
  const prisma = new PrismaClient();
  
  try {
    // Add new user types to enum
    await prisma.$executeRaw`
      ALTER TABLE users 
      MODIFY COLUMN user_type ENUM('donor', 'federation', 'club', 'player', 'company', 'affiliate', 'academy', 'school', 'association')
    `;
    
    console.log('New user types added successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addNewUserTypes();