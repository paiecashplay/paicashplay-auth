const { PrismaClient } = require('@prisma/client');
const { Storage } = require('@google-cloud/storage');

const prisma = new PrismaClient();

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'paiecashplay-user-file';
const bucket = storage.bucket(bucketName);

async function cleanupOrphanedPhotos() {
  console.log('🧹 Starting cleanup of orphaned profile photos...');
  
  try {
    // 1. Récupérer toutes les URLs d'avatar actives en BD
    const activeProfiles = await prisma.userProfile.findMany({
      where: {
        avatarUrl: {
          not: null,
          contains: bucketName
        }
      },
      select: {
        userId: true,
        avatarUrl: true
      }
    });
    
    console.log(`📊 Found ${activeProfiles.length} active profiles with photos`);
    
    const activeUrls = new Set(activeProfiles.map(p => p.avatarUrl));
    console.log(`📊 Active photo URLs: ${activeUrls.size}`);
    
    // 2. Lister tous les fichiers dans le bucket
    const [files] = await bucket.getFiles({
      prefix: 'profile-photos/',
    });
    
    console.log(`📊 Found ${files.length} files in storage`);
    
    let deletedCount = 0;
    let keptCount = 0;
    
    // 3. Vérifier chaque fichier
    for (const file of files) {
      const fileUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`;
      
      if (activeUrls.has(fileUrl)) {
        console.log(`✅ Keeping active photo: ${file.name}`);
        keptCount++;
      } else {
        console.log(`🗑️ Deleting orphaned photo: ${file.name}`);
        try {
          await file.delete();
          deletedCount++;
          console.log(`✅ Deleted: ${file.name}`);
        } catch (error) {
          console.error(`❌ Failed to delete ${file.name}:`, error.message);
        }
      }
    }
    
    console.log(`\n📊 Cleanup Summary:`);
    console.log(`   - Files kept: ${keptCount}`);
    console.log(`   - Files deleted: ${deletedCount}`);
    console.log(`   - Total processed: ${files.length}`);
    
    // 4. Vérifier les URLs en BD qui pointent vers des fichiers inexistants
    console.log('\n🔍 Checking for broken URLs in database...');
    
    let brokenUrlsCount = 0;
    for (const profile of activeProfiles) {
      const fileName = profile.avatarUrl.split(`${bucketName}/`)[1];
      if (fileName) {
        try {
          const [exists] = await bucket.file(fileName).exists();
          if (!exists) {
            console.log(`💔 Broken URL found for user ${profile.userId}: ${profile.avatarUrl}`);
            
            // Optionnel: nettoyer l'URL cassée en BD
            await prisma.userProfile.update({
              where: { userId: profile.userId },
              data: { avatarUrl: null }
            });
            
            brokenUrlsCount++;
            console.log(`🧹 Cleaned broken URL for user ${profile.userId}`);
          }
        } catch (error) {
          console.error(`❌ Error checking file for user ${profile.userId}:`, error.message);
        }
      }
    }
    
    console.log(`\n📊 Broken URLs cleaned: ${brokenUrlsCount}`);
    console.log('✅ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le nettoyage
cleanupOrphanedPhotos();