const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOAuthClient() {
  console.log('🔍 Vérification des clients OAuth...\n');

  try {
    const clients = await prisma.oAuthClient.findMany({
      select: {
        id: true,
        clientId: true,
        name: true,
        redirectUris: true,
        allowedScopes: true,
        isActive: true
      }
    });

    if (clients.length === 0) {
      console.log('❌ Aucun client OAuth trouvé !');
      console.log('\n📋 Pour créer un client OAuth :');
      console.log('1. Aller sur http://localhost:3000/admin/login');
      console.log('2. Se connecter en tant qu\'admin');
      console.log('3. Aller dans "Clients OAuth"');
      console.log('4. Créer un nouveau client avec les bonnes URLs de redirection');
      return;
    }

    console.log(`✅ ${clients.length} client(s) OAuth trouvé(s) :\n`);

    clients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.name}`);
      console.log(`   Client ID: ${client.clientId}`);
      console.log(`   Actif: ${client.isActive ? '✅' : '❌'}`);
      console.log(`   URLs de redirection autorisées:`);
      
      const redirectUris = Array.isArray(client.redirectUris) 
        ? client.redirectUris 
        : JSON.parse(client.redirectUris || '[]');
        
      if (redirectUris.length === 0) {
        console.log('     ❌ Aucune URL de redirection configurée !');
      } else {
        redirectUris.forEach(uri => {
          console.log(`     - ${uri}`);
        });
      }
      
      console.log(`   Scopes autorisés:`);
      const allowedScopes = Array.isArray(client.allowedScopes) 
        ? client.allowedScopes 
        : JSON.parse(client.allowedScopes || '[]');
        
      if (allowedScopes.length === 0) {
        console.log('     ❌ Aucun scope configuré !');
      } else {
        allowedScopes.forEach(scope => {
          console.log(`     - ${scope}`);
        });
      }
      
      console.log('');
    });

    console.log('💡 Pour résoudre l\'erreur "URL de redirection invalide" :');
    console.log('1. Vérifiez que le client_id dans votre requête correspond à un des clients ci-dessus');
    console.log('2. Vérifiez que l\'URL de redirection dans votre requête correspond EXACTEMENT à une des URLs autorisées');
    console.log('3. Vérifiez que le client est actif');
    console.log('\n🔗 Exemple d\'URL OAuth valide :');
    
    if (clients.length > 0 && clients[0].isActive) {
      const client = clients[0];
      const redirectUris = Array.isArray(client.redirectUris) 
        ? client.redirectUris 
        : JSON.parse(client.redirectUris || '[]');
        
      if (redirectUris.length > 0) {
        console.log(`http://localhost:3000/api/auth/authorize?response_type=code&client_id=${client.clientId}&redirect_uri=${encodeURIComponent(redirectUris[0])}&scope=openid%20profile%20email`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkOAuthClient();