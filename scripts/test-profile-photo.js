const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function testProfilePhotoSystem() {
  console.log('🧪 Test du système de photos de profil...\n');

  try {
    // 1. Trouver un utilisateur avec un compte social
    const userWithSocial = await prisma.user.findFirst({
      include: {
        profile: true,
        socialAccounts: true
      },
      where: {
        socialAccounts: {
          some: {}
        }
      }
    });

    if (!userWithSocial) {
      console.log('❌ Aucun utilisateur avec compte social trouvé');
      return;
    }

    console.log(`👤 Utilisateur testé: ${userWithSocial.email}`);
    console.log(`📱 Comptes sociaux: ${userWithSocial.socialAccounts.length}`);
    
    // Afficher l'avatar social s'il existe
    const socialAvatar = userWithSocial.socialAccounts.find(acc => acc.avatar)?.avatar;
    if (socialAvatar) {
      console.log(`🖼️  Avatar social: ${socialAvatar.substring(0, 50)}...`);
    }

    // Afficher l'avatar du profil s'il existe
    if (userWithSocial.profile?.avatarUrl) {
      console.log(`📸 Avatar profil: ${userWithSocial.profile.avatarUrl}`);
      
      // Vérifier si c'est une URL Google Cloud Storage
      const isGCS = userWithSocial.profile.avatarUrl.includes('storage.googleapis.com');
      console.log(`☁️  Stocké sur GCS: ${isGCS ? '✅' : '❌'}`);
    } else {
      console.log('📸 Aucun avatar dans le profil');
    }

    // 2. Simuler la logique de priorité des avatars
    console.log('\n🔄 Test de la logique de priorité:');
    
    let pictureUrl = userWithSocial.profile?.avatarUrl;
    
    // Si pas d'avatar uploadé ou pas sur GCS, utiliser l'avatar social
    if (!pictureUrl || !pictureUrl.includes('storage.googleapis.com')) {
      const socialAvatar = userWithSocial.socialAccounts.find(account => account.avatar)?.avatar;
      if (socialAvatar && !pictureUrl) {
        pictureUrl = socialAvatar;
        console.log('📱 Utilisation de l\'avatar social comme fallback');
      }
    } else {
      console.log('📸 Utilisation de l\'avatar uploadé (priorité)');
    }

    console.log(`🎯 URL finale: ${pictureUrl ? pictureUrl.substring(0, 50) + '...' : 'Aucune'}`);

    // 3. Vérifier la structure de la base de données
    console.log('\n🗄️  Vérification de la structure BD:');
    
    const profileFields = await prisma.$queryRaw`
      DESCRIBE user_profiles
    `;
    
    const avatarField = profileFields.find(field => field.Field === 'avatar_url');
    if (avatarField) {
      console.log(`✅ Champ avatar_url existe: ${avatarField.Type}`);
    } else {
      console.log('❌ Champ avatar_url manquant');
    }

    console.log('\n✅ Test terminé avec succès');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProfilePhotoSystem();