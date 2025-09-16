const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function testPhotoUploadProcess() {
  console.log('🧪 Testing photo upload process...');
  
  try {
    // 1. Créer un utilisateur de test
    const testUser = await prisma.user.create({
      data: {
        email: `test-photo-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        userType: 'player',
        isVerified: true,
        profile: {
          create: {
            firstName: 'Test',
            lastName: 'User',
            avatarUrl: 'https://example.com/old-photo.jpg' // Ancienne photo
          }
        }
      },
      include: {
        profile: true
      }
    });
    
    console.log('✅ Test user created:', testUser.id);
    console.log('📷 Initial avatar URL:', testUser.profile.avatarUrl);
    
    // 2. Créer un client OAuth de test
    const testClient = await prisma.oAuthClient.create({
      data: {
        clientId: `test-client-${Date.now()}`,
        clientSecret: 'test-secret',
        name: 'Test Client',
        redirectUris: ['http://localhost:3000/callback'],
        allowedScopes: ['openid', 'profile', 'email']
      }
    });
    
    console.log('✅ Test OAuth client created:', testClient.clientId);
    
    // 3. Créer un access token de test
    const accessToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
    
    const testToken = await prisma.accessToken.create({
      data: {
        tokenHash: tokenHash,
        clientId: testClient.clientId,
        userId: testUser.id,
        scope: 'openid profile email',
        expiresAt: new Date(Date.now() + 3600000) // 1 heure
      }
    });
    
    console.log('✅ Test access token created');
    
    // 4. Simuler l'upload d'une nouvelle photo
    const newPhotoUrl = `https://storage.googleapis.com/paiecashplay-user-file/profile-photos/${testUser.id}/${Date.now()}.jpg`;
    
    // Mettre à jour le profil avec la nouvelle URL
    const updatedProfile = await prisma.userProfile.update({
      where: { userId: testUser.id },
      data: {
        avatarUrl: newPhotoUrl,
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Profile updated with new photo URL:', newPhotoUrl);
    
    // 5. Vérifier que les données sont bien mises à jour
    const tokenWithUser = await prisma.accessToken.findFirst({
      where: {
        tokenHash: tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });
    
    console.log('🔍 Verification - Current avatar URL:', tokenWithUser.user.profile.avatarUrl);
    console.log('🔍 Verification - Updated at:', tokenWithUser.user.profile.updatedAt);
    
    // 6. Tester la récupération via userinfo
    console.log('📋 Testing userinfo response format...');
    
    const userInfo = {
      sub: tokenWithUser.user.id,
      email: tokenWithUser.user.email,
      email_verified: tokenWithUser.user.isVerified,
      name: `${tokenWithUser.user.profile.firstName} ${tokenWithUser.user.profile.lastName}`.trim(),
      given_name: tokenWithUser.user.profile.firstName,
      family_name: tokenWithUser.user.profile.lastName,
      picture: tokenWithUser.user.profile.avatarUrl,
      updated_at: Math.floor(new Date(tokenWithUser.user.profile.updatedAt).getTime() / 1000)
    };
    
    console.log('📋 UserInfo response:', JSON.stringify(userInfo, null, 2));
    
    // 7. Nettoyer les données de test
    await prisma.accessToken.delete({ where: { id: testToken.id } });
    await prisma.oAuthClient.delete({ where: { id: testClient.id } });
    await prisma.userProfile.delete({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    
    console.log('🧹 Test data cleaned up');
    console.log('✅ Photo upload process test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testPhotoUploadProcess();