const { EmailService } = require('../src/lib/email-service');

async function testEmailConfiguration() {
  console.log('📧 Test de la configuration email...\n');

  try {
    // 1. Tester la connexion SMTP
    console.log('1. Test de la connexion SMTP...');
    const smtpTest = await EmailService.testSmtpConnection();
    
    if (smtpTest.success) {
      console.log('✅ Connexion SMTP réussie');
    } else {
      console.log('❌ Échec de la connexion SMTP:', smtpTest.message);
      if (smtpTest.code) {
        console.log('   Code d\'erreur:', smtpTest.code);
      }
      
      console.log('\n📋 Vérifiez votre configuration dans .env.development :');
      console.log('   SMTP_HOST=smtp.gmail.com');
      console.log('   SMTP_PORT=587');
      console.log('   SMTP_USER=your-email@gmail.com');
      console.log('   SMTP_PASSWORD=your-app-password');
      console.log('   FROM_EMAIL=noreply@paiecashplay.com');
      console.log('   FROM_NAME=PaieCashPlay Fondation');
      
      return;
    }

    // 2. Tester l'envoi d'un email de reset (simulation)
    console.log('\n2. Test de génération d\'email de reset...');
    
    try {
      // Ne pas envoyer réellement, juste tester la génération
      const resetUrl = 'http://localhost:3000/reset-password?token=test123&oauth_session=oauth456';
      
      // Simuler la génération du template
      const { EmailTemplateService } = require('../src/lib/email-templates');
      const emailHtml = await EmailTemplateService.getPasswordResetEmail({
        firstName: 'Test',
        resetUrl: resetUrl
      });
      
      console.log('✅ Template d\'email généré avec succès');
      console.log('   Longueur du HTML:', emailHtml.length, 'caractères');
      
      // Vérifier que les variables sont remplacées
      if (emailHtml.includes('{{firstName}}') || emailHtml.includes('{{resetUrl}}')) {
        console.log('⚠️  Attention: Des variables ne sont pas remplacées dans le template');
      } else {
        console.log('✅ Variables correctement remplacées dans le template');
      }
      
    } catch (templateError) {
      console.log('❌ Erreur de génération du template:', templateError.message);
    }

    console.log('\n🎉 Configuration email validée !');
    console.log('\n📋 Pour tester l\'envoi réel d\'emails :');
    console.log('   1. Configurez vos vraies credentials SMTP dans .env.development');
    console.log('   2. Utilisez l\'interface web pour demander un reset de mot de passe');
    console.log('   3. Vérifiez votre boîte mail (et les spams)');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
  }
}

// Exécuter le test
testEmailConfiguration();