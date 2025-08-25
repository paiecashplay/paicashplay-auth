const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function seed() {
  const prisma = new PrismaClient();

  try {
    console.log('🌱 Seeding production database...');

    // Créer admin par défaut
    const adminExists = await prisma.adminUser.findUnique({
      where: { username: 'admin' }
    });

    if (!adminExists) {
      console.log('👤 Creating default admin user...');
      const passwordHash = await bcrypt.hash('admin123', 12);

      await prisma.adminUser.create({
        data: {
          username: 'admin',
          passwordHash,
          email: 'admin@paiecashplay.com',
          fullName: 'Administrateur Principal'
        }
      });
      console.log('✅ Admin user created: admin/admin123');

      // Configurations système
      const configs = [
        { key: 'APP_NAME', value: 'PaieCashPlay', type: 'STRING', description: 'Nom de l\'application' },
        { key: 'APP_URL', value: 'https://auth.paiecashplay.com', type: 'STRING', description: 'URL de l\'application' },
        { key: 'SUPPORT_EMAIL', value: 'support@paiecashplay.com', type: 'STRING', description: 'Email de support' },
        { key: 'JWT_EXPIRY', value: '7d', type: 'STRING', description: 'Durée d\'expiration des JWT' },
        { key: 'SESSION_EXPIRY', value: '604800', type: 'NUMBER', description: 'Durée de session en secondes (7 jours)' },
        { key: 'PASSWORD_MIN_LENGTH', value: '8', type: 'NUMBER', description: 'Longueur minimale du mot de passe' },
        { key: 'ENABLE_REGISTRATION', value: 'true', type: 'BOOLEAN', description: 'Autoriser les inscriptions' },
        { key: 'ENABLE_EMAIL_VERIFICATION', value: 'true', type: 'BOOLEAN', description: 'Vérification email obligatoire' },
        { key: 'smtp_host', value: 'smtp.gmail.com', type: 'STRING', description: 'Serveur SMTP' },
        { key: 'smtp_port', value: '587', type: 'NUMBER', description: 'Port SMTP' },
        { key: 'smtp_secure', value: 'false', type: 'BOOLEAN', description: 'Connexion sécurisée SMTP' },
        { key: 'from_email', value: 'noreply@paiecashplay.com', type: 'STRING', description: 'Email expéditeur' },
        { key: 'from_name', value: 'PaieCashPlay Fondation', type: 'STRING', description: 'Nom expéditeur' },
        { key: 'jwt_secret', value: process.env.JWT_SECRET || 'default-jwt-secret', type: 'STRING', description: 'Clé secrète JWT', encrypted: true },
        { key: 'issuer', value: process.env.NEXTAUTH_URL || 'https://auth.paiecashplay.com', type: 'STRING', description: 'Émetteur JWT' },
        { key: 'session_duration', value: '7', type: 'NUMBER', description: 'Durée session (jours)' },
        { key: 'max_login_attempts', value: '5', type: 'NUMBER', description: 'Tentatives de connexion max' },
        { key: 'password_min_length', value: '8', type: 'NUMBER', description: 'Longueur minimale mot de passe' }
      ];

      console.log('⚙️ Creating system configurations...');
      for (const config of configs) {
        const exists = await prisma.systemConfig.findUnique({
          where: { configKey: config.key }
        });

        if (!exists) {
          await prisma.systemConfig.create({
            data: {
              configKey: config.key,
              configValue: config.value,
              configType: config.type,
              description: config.description,
              isEncrypted: config.encrypted || false
            }
          });
        }
      }

      // 3. Providers d'authentification sociale
      const providers = [
        {
          id: 'google_provider',
          name: 'google',
          displayName: 'Google',
          type: 'google',
          clientId: process.env.GOOGLE_CLIENT_ID || '',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
          isEnabled: false,
          config: {
            authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token',
            userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
            scopes: ['openid', 'email', 'profile']
          }
        },
        {
          id: 'facebook_provider',
          name: 'facebook',
          displayName: 'Facebook',
          type: 'facebook',
          clientId: process.env.FACEBOOK_CLIENT_ID || '',
          clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
          isEnabled: false,
          config: {
            authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
            tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
            userInfoUrl: 'https://graph.facebook.com/me',
            scopes: ['email', 'public_profile']
          }
        },
        {
          id: 'linkedin_provider',
          name: 'linkedin',
          displayName: 'LinkedIn',
          type: 'linkedin',
          clientId: process.env.LINKEDIN_CLIENT_ID || '',
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
          isEnabled: false,
          config: {
            authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
            tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
            userInfoUrl: 'https://api.linkedin.com/v2/people/~',
            scopes: ['r_liteprofile', 'r_emailaddress']
          }
        }
      ];

      for (const provider of providers) {
        await prisma.identityProvider.upsert({
          where: { name: provider.name },
          update: {
            displayName: provider.displayName,
            clientId: provider.clientId,
            clientSecret: provider.clientSecret,
            isEnabled: provider.isEnabled,
            config: provider.config
          },
          create: provider
        });
      }

    }







    console.log('✅ Production database seeded successfully');

  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});