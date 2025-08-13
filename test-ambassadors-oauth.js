// Test script pour vérifier les scopes ambassadeurs OAuth
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testAmbassadorsOAuth() {
  console.log('🧪 Test des scopes ambassadeurs OAuth...\n');

  try {
    // 1. Créer un client OAuth avec le scope ambassadors:read
    console.log('1. Création d\'un client OAuth avec scope ambassadors:read...');
    
    const clientResponse = await fetch(`${BASE_URL}/api/admin/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin_token_here' // À remplacer par un vrai token admin
      },
      body: JSON.stringify({
        name: 'Test Ambassadors Client',
        description: 'Client de test pour les ambassadeurs',
        redirectUris: ['http://localhost:3001/callback'],
        allowedScopes: ['openid', 'profile', 'email', 'ambassadors:read']
      })
    });

    if (!clientResponse.ok) {
      console.log('❌ Erreur lors de la création du client:', await clientResponse.text());
      return;
    }

    const clientData = await clientResponse.json();
    console.log('✅ Client créé:', clientData.client.clientId);

    // 2. Tester l'endpoint d'autorisation avec le scope ambassadors:read
    console.log('\n2. Test de l\'endpoint d\'autorisation...');
    
    const authUrl = new URL(`${BASE_URL}/api/auth/authorize`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientData.client.clientId);
    authUrl.searchParams.set('redirect_uri', 'http://localhost:3001/callback');
    authUrl.searchParams.set('scope', 'openid profile ambassadors:read');
    authUrl.searchParams.set('state', 'test_state');

    console.log('🔗 URL d\'autorisation:', authUrl.toString());
    console.log('✅ URL générée avec succès');

    // 3. Vérifier que l'API ambassadors existe
    console.log('\n3. Test de l\'API ambassadors (sans token)...');
    
    const ambassadorsResponse = await fetch(`${BASE_URL}/api/oauth/ambassadors`);
    
    if (ambassadorsResponse.status === 401) {
      console.log('✅ API ambassadors protégée correctement (401 sans token)');
    } else {
      console.log('❌ API ambassadors non protégée:', ambassadorsResponse.status);
    }

    console.log('\n🎉 Tests terminés avec succès !');
    console.log('\nPour tester complètement :');
    console.log('1. Utilisez l\'URL d\'autorisation ci-dessus dans un navigateur');
    console.log('2. Connectez-vous avec un compte utilisateur');
    console.log('3. Récupérez le code d\'autorisation');
    console.log('4. Échangez-le contre un access token');
    console.log('5. Utilisez le token pour appeler /api/oauth/ambassadors');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Fonction pour tester avec un token d'accès
async function testWithAccessToken(accessToken) {
  console.log('\n🔐 Test avec access token...');

  try {
    const response = await fetch(`${BASE_URL}/api/oauth/ambassadors`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API ambassadors accessible:', data.ambassadors?.length || 0, 'ambassadeurs trouvés');
    } else {
      const error = await response.json();
      console.log('❌ Erreur API ambassadors:', error);
    }
  } catch (error) {
    console.error('❌ Erreur lors du test avec token:', error.message);
  }
}

// Exécuter le test
if (require.main === module) {
  testAmbassadorsOAuth();
}

module.exports = { testAmbassadorsOAuth, testWithAccessToken };