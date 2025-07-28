#!/usr/bin/env node

/**
 * Script de test pour vérifier la création d'un compte société
 * Usage: node scripts/test-company-signup.js
 */

const fetch = require('node-fetch');

const testData = {
  email: 'test-company@example.com',
  password: 'TestPassword123',
  firstName: 'Jean',
  lastName: 'Dupont',
  userType: 'company',
  phone: '+33123456789',
  country: 'FR',
  isPartner: true,
  metadata: {
    companyName: 'Test Company SARL',
    siret: '12345678901234'
  }
};

async function testCompanySignup() {
  try {
    console.log('🧪 Test de création d\'un compte société...');
    console.log('📧 Email:', testData.email);
    console.log('🏢 Société:', testData.metadata.companyName);
    console.log('🤝 Partenaire:', testData.isPartner ? 'Oui' : 'Non');
    
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Compte société créé avec succès!');
      console.log('📝 Réponse:', result);
    } else {
      console.log('❌ Erreur lors de la création:', result.error);
    }

  } catch (error) {
    console.error('❌ Erreur de test:', error.message);
  }
}

// Fonction pour nettoyer les données de test
async function cleanupTestData() {
  try {
    console.log('🧹 Nettoyage des données de test...');
    
    // Note: Cette fonction nécessiterait une API admin pour supprimer l'utilisateur
    // Pour l'instant, on affiche juste un message
    console.log('ℹ️  Supprimez manuellement l\'utilisateur test-company@example.com si nécessaire');
    
  } catch (error) {
    console.error('❌ Erreur de nettoyage:', error.message);
  }
}

// Exécuter le test
console.log('🚀 Démarrage du test de création de compte société\n');
testCompanySignup()
  .then(() => {
    console.log('\n✅ Test terminé');
  })
  .catch((error) => {
    console.error('\n❌ Test échoué:', error);
  });