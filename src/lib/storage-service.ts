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
    const fileName = `profile-photos/${userId}/${Date.now()}${fileExtension}`;
    console.log('📦 [STORAGE] Generated filename:', fileName);
    
    const fileUpload = bucket.file(fileName);
    const contentType = this.getContentType(fileExtension);
    console.log('📦 [STORAGE] Content type:', contentType);
    
    try {
      await fileUpload.save(file, {
        metadata: {
          contentType: contentType,
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
    
    if (!photoUrl.includes(bucketName)) {
      console.log('🗑️ [STORAGE] Photo not in our bucket, skipping delete');
      return;
    }
    
    const fileName = photoUrl.split(`${bucketName}/`)[1];
    console.log('🗑️ [STORAGE] Extracted filename:', fileName);
    
    if (fileName) {
      try {
        await bucket.file(fileName).delete();
        console.log('✅ [STORAGE] Photo deleted successfully');
      } catch (error) {
        console.error('💥 [STORAGE] Delete failed:', error);
        throw error;
      }
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
}