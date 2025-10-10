const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testPasswordResetCycle() {
  console.log('🔄 Test du cycle de récupération de mot de passe...\n');

  try {
    // 1. Créer un utilisateur de test
    console.log('1. Création d\'un utilisateur de test...');
    
    // Supprimer l'utilisateur s'il existe déjà
    await prisma.user.deleteMany({
      where: { email: 'test-reset@example.com' }
    });

    const hashedPassword = await bcrypt.hash('oldpassword123', 12);
    
    const testUser = await prisma.user.create({
      data: {
        email: 'test-reset@example.com',
        passwordHash: hashedPassword,
        emailVerified: true,
        profile: {
          create: {
            firstName: 'Test',
            lastName: 'User',
            userType: 'donor'
          }
        }
      },
      include: { profile: true }
    });
    
    console.log('✅ Utilisateur créé:', testUser.email);

    // 2. Tester l'endpoint forgot-password
    console.log('\n2. Test de l\'endpoint forgot-password...');
    
    const forgotResponse = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test-reset@example.com' })
    });
    
    const forgotData = await forgotResponse.json();
    console.log('Réponse forgot-password:', forgotData);
    
    if (!forgotResponse.ok) {
      throw new Error('Échec de l\'endpoint forgot-password');
    }
    
    // 3. Récupérer le token de reset depuis la base
    console.log('\n3. Récupération du token de reset...');
    
    const resetToken = await prisma.passwordReset.findFirst({
      where: { userId: testUser.id },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!resetToken) {
      throw new Error('Token de reset non trouvé');
    }
    
    console.log('✅ Token de reset trouvé:', resetToken.token.substring(0, 10) + '...');

    // 4. Tester la validation du token
    console.log('\n4. Test de validation du token...');
    
    const validateResponse = await fetch('http://localhost:3000/api/auth/validate-reset-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken.token })
    });
    
    const validateData = await validateResponse.json();
    console.log('Réponse validation:', validateData);
    
    if (!validateResponse.ok) {
      throw new Error('Échec de la validation du token');
    }

    // 5. Tester le reset du mot de passe
    console.log('\n5. Test du reset de mot de passe...');
    
    const resetResponse = await fetch('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token: resetToken.token, 
        password: 'newpassword123' 
      })
    });
    
    const resetData = await resetResponse.json();
    console.log('Réponse reset:', resetData);
    
    if (!resetResponse.ok) {
      throw new Error('Échec du reset de mot de passe');
    }

    // 6. Vérifier que le mot de passe a été changé
    console.log('\n6. Vérification du changement de mot de passe...');
    
    const updatedUser = await prisma.user.findUnique({
      where: { id: testUser.id }
    });
    
    const passwordValid = await bcrypt.compare('newpassword123', updatedUser.passwordHash);
    
    if (!passwordValid) {
      throw new Error('Le mot de passe n\'a pas été mis à jour');
    }
    
    console.log('✅ Mot de passe mis à jour avec succès');

    // 7. Vérifier que le token a été marqué comme utilisé
    console.log('\n7. Vérification du statut du token...');
    
    const usedToken = await prisma.passwordReset.findUnique({
      where: { id: resetToken.id }
    });
    
    if (!usedToken.used) {
      throw new Error('Le token n\'a pas été marqué comme utilisé');
    }
    
    console.log('✅ Token marqué comme utilisé');

    // 8. Tester qu'on ne peut pas réutiliser le token
    console.log('\n8. Test de réutilisation du token...');
    
    const reuseResponse = await fetch('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token: resetToken.token, 
        password: 'anothernewpassword123' 
      })
    });
    
    if (reuseResponse.ok) {
      throw new Error('Le token usagé a pu être réutilisé (problème de sécurité)');
    }
    
    console.log('✅ Token usagé correctement rejeté');

    // 9. Nettoyer
    console.log('\n9. Nettoyage...');
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✅ Utilisateur de test supprimé');

    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('\n📋 Résumé du cycle de récupération de mot de passe :');
    console.log('   ✅ Demande de reset (forgot-password)');
    console.log('   ✅ Génération et stockage du token');
    console.log('   ✅ Validation du token');
    console.log('   ✅ Reset du mot de passe');
    console.log('   ✅ Marquage du token comme utilisé');
    console.log('   ✅ Protection contre la réutilisation');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testPasswordResetCycle();