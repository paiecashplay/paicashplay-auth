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
    }
    
    // Configurations système
    const configs = [
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