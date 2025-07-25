import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user
  const adminExists = await prisma.adminUser.findUnique({
    where: { username: 'admin' }
  });

  if (!adminExists) {
    console.log('👤 Creating default admin user...');
    const passwordHash = await hashPassword('password');
    
    await prisma.adminUser.create({
      data: {
        username: 'admin',
        passwordHash,
        email: 'admin@paiecashplay.com',
        fullName: 'Administrateur Principal'
      }
    });
    
    console.log('✅ Default admin user created (admin/password)');
  }

  // Create system configurations
  const configs = [
    { key: 'smtp_host', value: 'smtp.gmail.com', type: 'STRING', description: 'Serveur SMTP' },
    { key: 'smtp_port', value: '587', type: 'NUMBER', description: 'Port SMTP' },
    { key: 'smtp_user', value: '', type: 'STRING', description: 'Utilisateur SMTP' },
    { key: 'smtp_password', value: '', type: 'STRING', description: 'Mot de passe SMTP', encrypted: true },
    { key: 'smtp_secure', value: 'false', type: 'BOOLEAN', description: 'Connexion sécurisée SMTP' },
    { key: 'from_email', value: 'noreply@paiecashplay.com', type: 'STRING', description: 'Email expéditeur' },
    { key: 'from_name', value: 'PaieCashPlay Fondation', type: 'STRING', description: 'Nom expéditeur' },
    { key: 'jwt_secret', value: process.env.JWT_SECRET || 'default-jwt-secret', type: 'STRING', description: 'Clé secrète JWT', encrypted: true },
    { key: 'issuer', value: 'https://auth.paiecashplay.com', type: 'STRING', description: 'Émetteur JWT' },
    { key: 'session_duration', value: '7', type: 'NUMBER', description: 'Durée session (jours)' },
    { key: 'max_login_attempts', value: '5', type: 'NUMBER', description: 'Tentatives de connexion max' },
    { key: 'password_min_length', value: '8', type: 'NUMBER', description: 'Longueur minimale mot de passe' }
  ];

  for (const config of configs) {
    const exists = await prisma.systemConfig.findUnique({
      where: { configKey: config.key }
    });

    if (!exists) {
      await prisma.systemConfig.create({
        data: {
          configKey: config.key,
          configValue: config.value,
          configType: config.type as any,
          description: config.description,
          isEncrypted: config.encrypted || false
        }
      });
    }
  }

  console.log('✅ System configurations initialized');
  console.log('🎉 Database seeding completed');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });