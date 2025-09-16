const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUserData() {
  try {
    // Récupérer tous les utilisateurs avec leurs profils
    const users = await prisma.user.findMany({
      include: { profile: true },
      take: 5 // Limiter à 5 utilisateurs pour le test
    });

    console.log('📊 [TEST] Users in database:');
    users.forEach(user => {
      console.log(`👤 User ${user.id}:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Profile Avatar URL: ${user.profile?.avatarUrl || 'null'}`);
      console.log(`   Profile Updated At: ${user.profile?.updatedAt || 'null'}`);
      console.log('---');
    });

    // Test de récupération d'un utilisateur spécifique avec image
    const userWithImage = users.find(u => u.profile?.avatarUrl);
    if (userWithImage) {
      console.log(`🔍 [TEST] Testing fresh data retrieval for user with image ${userWithImage.id}:`);
      
      const freshUser = await prisma.user.findUnique({
        where: { id: userWithImage.id },
        include: { profile: true }
      });
      
      console.log(`   Fresh Avatar URL: ${freshUser?.profile?.avatarUrl || 'null'}`);
      console.log(`   Fresh Updated At: ${freshUser?.profile?.updatedAt || 'null'}`);
      
      // Test multiple récupérations pour vérifier la cohérence
      for (let i = 0; i < 3; i++) {
        const testUser = await prisma.user.findUnique({
          where: { id: userWithImage.id },
          include: { profile: true }
        });
        console.log(`   Test ${i+1} - Avatar URL: ${testUser?.profile?.avatarUrl || 'null'}`);
      }
    }

  } catch (error) {
    console.error('❌ [TEST] Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserData();