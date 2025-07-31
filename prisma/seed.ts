import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Créer l'admin par défaut
  const adminExists = await prisma.adminUser.findUnique({
    where: { username: 'admin' }
  });

  if (!adminExists) {
    const hashedPassword = await hashPassword('admin123');
    await prisma.adminUser.create({
      data: {
        username: 'admin',
        passwordHash: hashedPassword,
        email: 'admin@paiecashplay.com',
        fullName: 'Administrateur PaieCashPlay'
      }
    });
    console.log('✅ Admin par défaut créé (admin/admin123)');
  }

  // 2. Configuration SMTP par défaut
  const smtpConfigs = [
    { key: 'SMTP_HOST', value: 'smtp.gmail.com', type: 'STRING', description: 'Serveur SMTP' },
    { key: 'SMTP_PORT', value: '587', type: 'NUMBER', description: 'Port SMTP' },
    { key: 'SMTP_USER', value: '', type: 'STRING', description: 'Utilisateur SMTP' },
    { key: 'SMTP_PASSWORD', value: '', type: 'STRING', description: 'Mot de passe SMTP', encrypted: true },
    { key: 'FROM_EMAIL', value: 'noreply@paiecashplay.com', type: 'STRING', description: 'Email expéditeur' },
    { key: 'FROM_NAME', value: 'PaieCashPlay', type: 'STRING', description: 'Nom expéditeur' }
  ];

  for (const config of smtpConfigs) {
    await prisma.systemConfig.upsert({
      where: { configKey: config.key },
      update: {},
      create: {
        configKey: config.key,
        configValue: config.value,
        configType: config.type as any,
        description: config.description,
        isEncrypted: config.encrypted || false
      }
    });
  }
  console.log('✅ Configuration SMTP par défaut créée');

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
  console.log('✅ Providers d\'authentification sociale configurés');

  // 4. Configuration générale de l'application
  const appConfigs = [
    { key: 'APP_NAME', value: 'PaieCashPlay', type: 'STRING', description: 'Nom de l\'application' },
    { key: 'APP_URL', value: 'https://auth.paiecashplay.com', type: 'STRING', description: 'URL de l\'application' },
    { key: 'SUPPORT_EMAIL', value: 'support@paiecashplay.com', type: 'STRING', description: 'Email de support' },
    { key: 'JWT_EXPIRY', value: '7d', type: 'STRING', description: 'Durée d\'expiration des JWT' },
    { key: 'SESSION_EXPIRY', value: '604800', type: 'NUMBER', description: 'Durée de session en secondes (7 jours)' },
    { key: 'PASSWORD_MIN_LENGTH', value: '8', type: 'NUMBER', description: 'Longueur minimale du mot de passe' },
    { key: 'ENABLE_REGISTRATION', value: 'true', type: 'BOOLEAN', description: 'Autoriser les inscriptions' },
    { key: 'ENABLE_EMAIL_VERIFICATION', value: 'true', type: 'BOOLEAN', description: 'Vérification email obligatoire' }
  ];

  for (const config of appConfigs) {
    await prisma.systemConfig.upsert({
      where: { configKey: config.key },
      update: {},
      create: {
        configKey: config.key,
        configValue: config.value,
        configType: config.type as any,
        description: config.description
      }
    });
  }
  console.log('✅ Configuration générale de l\'application créée');

  console.log('🎉 Seeding terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });