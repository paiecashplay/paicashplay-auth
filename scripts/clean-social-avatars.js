const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanSocialAvatars() {
  console.log('🧹 Nettoyage des avatars sociaux copiés dans les profils...\n');

  try {
    // Trouver tous les utilisateurs avec des avatars qui ne sont pas sur Google Cloud Storage
    const usersWithSocialAvatars = await prisma.user.findMany({
      include: {
        profile: true,
        socialAccounts: true
      },
      where: {
        profile: {
          avatarUrl: {
            not: null,
            not: {
              contains: 'storage.googleapis.com'
            }
          }
        }
      }
    });

    console.log(`👥 Utilisateurs trouvés avec avatars sociaux: ${usersWithSocialAvatars.length}`);

    let cleanedCount = 0;

    for (const user of usersWithSocialAvatars) {
      const avatarUrl = user.profile?.avatarUrl;
      
      if (avatarUrl) {
        // Vérifier si c'est un avatar social (Google, Facebook, etc.)
        const isSocialAvatar = avatarUrl.includes('googleusercontent.com') || 
                              avatarUrl.includes('facebook.com') || 
                              avatarUrl.includes('linkedin.com');

        if (isSocialAvatar) {
          console.log(`🔄 Nettoyage pour ${user.email}: ${avatarUrl.substring(0, 50)}...`);
          
          // Supprimer l'avatar du profil (il reste dans socialAccounts)
          await prisma.userProfile.update({
            where: { userId: user.id },
            data: { avatarUrl: null }
          });
          
          cleanedCount++;
        }
      }
    }

    console.log(`\n✅ Nettoyage terminé: ${cleanedCount} profils nettoyés`);
    console.log('📱 Les avatars sociaux restent disponibles via socialAccounts');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanSocialAvatars();