const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupSocialProviders() {
  console.log('🔧 Configuration des providers sociaux...');

  try {
    // Créer les providers par défaut
    const providers = [
      {
        id: 'google_provider',
        name: 'google',
        displayName: 'Google',
        type: 'google',
        clientId: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your_google_client_secret',
        isEnabled: true
      },
      {
        id: 'facebook_provider',
        name: 'facebook',
        displayName: 'Facebook',
        type: 'facebook',
        clientId: process.env.FACEBOOK_CLIENT_ID || 'your_facebook_client_id',
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'your_facebook_client_secret',
        isEnabled: true
      },
      {
        id: 'linkedin_provider',
        name: 'linkedin',
        displayName: 'LinkedIn',
        type: 'linkedin',
        clientId: process.env.LINKEDIN_CLIENT_ID || 'your_linkedin_client_id',
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET || 'your_linkedin_client_secret',
        isEnabled: true
      }
    ];

    for (const provider of providers) {
      await prisma.identityProvider.upsert({
        where: { name: provider.name },
        update: {
          displayName: provider.displayName,
          clientId: provider.clientId,
          clientSecret: provider.clientSecret,
          isEnabled: provider.isEnabled
        },
        create: provider
      });
      console.log(`✅ Provider ${provider.displayName} configuré`);
    }

    console.log('🎉 Providers sociaux configurés avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupSocialProviders();