const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDefaultClub() {
  try {
    // Vérifier si le club par défaut existe déjà
    const existingClub = await prisma.user.findFirst({
      where: {
        email: 'club@paiecashplay.com',
        userType: 'club'
      }
    });

    if (existingClub) {
      console.log('✅ Le club PaieCashPlay existe déjà');
      return;
    }

    // Créer le mot de passe hashé
    const passwordHash = await bcrypt.hash('PaieCashPlay2024!', 12);

    // Créer le club par défaut
    const defaultClub = await prisma.user.create({
      data: {
        email: 'club@paiecashplay.com',
        passwordHash,
        userType: 'club',
        isVerified: true,
        isActive: true,
        profile: {
          create: {
            firstName: 'PaieCashPlay',
            lastName: 'Administration',
            country: 'FR',
            language: 'fr',
            metadata: {
              organizationName: 'PaieCashPlay Club',
              federation: 'Fédération Française de Football',
              isDefault: true
            }
          }
        }
      }
    });

    console.log('✅ Club par défaut créé avec succès:', {
      id: defaultClub.id,
      email: defaultClub.email,
      name: 'PaieCashPlay Club'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création du club par défaut:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultClub();