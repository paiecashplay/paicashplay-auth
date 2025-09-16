import { Storage } from '@google-cloud/storage';
import path from 'path';

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'paiecash-profile-photos';
const bucket = storage.bucket(bucketName);

export class StorageService {
  static async uploadProfilePhoto(
    userId: string,
    file: Buffer,
    originalName: string
  ): Promise<string> {
    console.log('📦 [STORAGE] Starting upload for user:', userId);
    console.log('📦 [STORAGE] Original filename:', originalName);
    console.log('📦 [STORAGE] File buffer size:', file.length);
    console.log('📦 [STORAGE] Bucket name:', bucketName);
    
    const fileExtension = path.extname(originalName);
    // Ajouter un timestamp plus précis pour éviter les conflits
    const timestamp = Date.now();
    const fileName = `profile-photos/${userId}/${timestamp}${fileExtension}`;
    console.log('📦 [STORAGE] Generated filename:', fileName);
    
    const fileUpload = bucket.file(fileName);
    const contentType = this.getContentType(fileExtension);
    console.log('📦 [STORAGE] Content type:', contentType);
    
    try {
      await fileUpload.save(file, {
        metadata: {
          contentType: contentType,
          cacheControl: 'no-cache, max-age=0', // Éviter le cache
        },
        public: true,
      });
      
      const finalUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
      console.log('✅ [STORAGE] Upload successful, URL:', finalUrl);
      return finalUrl;
    } catch (error) {
      console.error('💥 [STORAGE] Upload failed:', error);
      throw error;
    }
  }

  static async deleteProfilePhoto(photoUrl: string): Promise<void> {
    console.log('🗑️ [STORAGE] Attempting to delete photo:', photoUrl);
    
    if (!photoUrl || !photoUrl.includes(bucketName)) {
      console.log('🗑️ [STORAGE] Photo not in our bucket or invalid URL, skipping delete');
      return;
    }
    
    try {
      const fileName = photoUrl.split(`${bucketName}/`)[1];
      console.log('🗑️ [STORAGE] Extracted filename:', fileName);
      
      if (!fileName) {
        console.log('⚠️ [STORAGE] Could not extract filename from URL');
        return;
      }

      const file = bucket.file(fileName);
      
      // Vérifier si le fichier existe avant de le supprimer
      const [exists] = await file.exists();
      if (!exists) {
        console.log('🗑️ [STORAGE] File does not exist, nothing to delete');
        return;
      }

      await file.delete();
      console.log('✅ [STORAGE] Photo deleted successfully:', fileName);
    } catch (error: any) {
      console.error('💥 [STORAGE] Delete failed:', error);
      // Ne pas faire échouer si le fichier n'existe pas déjà
      if (error.code === 404) {
        console.log('🗑️ [STORAGE] File already deleted or not found');
        return;
      }
      throw error;
    }
  }

  private static getContentType(extension: string): string {
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return contentTypes[extension.toLowerCase()] || 'image/jpeg';
  }

  // Méthode utilitaire pour nettoyer les anciennes photos d'un utilisateur
  static async cleanupUserPhotos(userId: string, keepUrl?: string): Promise<void> {
    console.log('🧹 [STORAGE] Cleaning up old photos for user:', userId);
    
    try {
      const [files] = await bucket.getFiles({
        prefix: `profile-photos/${userId}/`,
      });
      
      for (const file of files) {
        const fileUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`;
        if (keepUrl && fileUrl === keepUrl) {
          console.log('🔒 [STORAGE] Keeping current photo:', file.name);
          continue;
        }
        
        try {
          await file.delete();
          console.log('✅ [STORAGE] Deleted old photo:', file.name);
        } catch (error) {
          console.warn('⚠️ [STORAGE] Failed to delete:', file.name, error);
        }
      }
    } catch (error) {
      console.error('💥 [STORAGE] Cleanup failed:', error);
    }
  }
}