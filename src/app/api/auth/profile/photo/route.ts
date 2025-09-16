import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { StorageService } from '@/lib/storage-service';
import { SessionSyncService } from '@/lib/session-sync';

import crypto from 'crypto';

// POST - Upload photo de profil (OAuth)
export async function POST(request: NextRequest) {
  console.log('🔄 [PHOTO UPLOAD] Starting photo upload process');
  
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Access token required' 
      }, { status: 401 });
    }

    const accessToken = authHeader.substring(7);
    const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
    console.log('🔍 [PHOTO UPLOAD] Token hash generated:', tokenHash.substring(0, 10) + '...');

    // Vérifier le token d'accès
    const tokenRecord = await prisma.accessToken.findFirst({
      where: {
        tokenHash: tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });

   

    if (!tokenRecord) {
      return NextResponse.json({ 
        error: 'Invalid or expired access token' 
      }, { status: 401 });
    }

    const scopes = tokenRecord.scope?.split(' ') || [];
    
    // Vérifier que l'application a les permissions pour modifier le profil
    if (!scopes.includes('profile')) {
      console.log('❌ [PHOTO UPLOAD] Insufficient scope');
      return NextResponse.json({ 
        error: 'Insufficient scope for profile modification' 
      }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json({ 
        error: 'No photo file provided' 
      }, { status: 400 });
    }


    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF and WebP are allowed' 
      }, { status: 400 });
    }

    // Vérifier la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB' 
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Récupérer l'ancienne URL avant upload pour suppression
    const oldAvatarUrl = tokenRecord.user.profile?.avatarUrl;
    console.log('🔍 [PHOTO UPLOAD] Old avatar URL:', oldAvatarUrl);

    // Upload la nouvelle photo AVANT de supprimer l'ancienne
    console.log('☁️ [PHOTO UPLOAD] Starting upload to Google Cloud Storage...');
    const photoUrl = await StorageService.uploadProfilePhoto(
      tokenRecord.userId,
      buffer,
      file.name
    );
    console.log('✅ [PHOTO UPLOAD] Photo uploaded successfully:', photoUrl);

    // Mettre à jour le profil avec la nouvelle URL
    console.log('💾 [PHOTO UPLOAD] Updating user profile in database...');
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId: tokenRecord.userId },
      create: {
        userId: tokenRecord.userId,
        firstName: tokenRecord.user.profile?.firstName || '',
        lastName: tokenRecord.user.profile?.lastName || '',
        avatarUrl: photoUrl
      },
      update: {
        avatarUrl: photoUrl,
        updatedAt: new Date() // Force update timestamp
      }
    });



    // Supprimer l'ancienne photo APRÈS la mise à jour réussie
    if (oldAvatarUrl && oldAvatarUrl !== photoUrl) {
      console.log('🗑️ [PHOTO UPLOAD] Deleting old photo:', oldAvatarUrl);
      try {
        await StorageService.deleteProfilePhoto(oldAvatarUrl);
        console.log('✅ [PHOTO UPLOAD] Old photo deleted successfully');
      } catch (error) {
        console.warn('⚠️ [PHOTO UPLOAD] Failed to delete old profile photo:', error);
        // Ne pas faire échouer la requête si la suppression échoue
      }
    }
    
    console.log('✅ [PHOTO UPLOAD] Profile updated in database:', {
      userId: updatedProfile.userId,
      avatarUrl: updatedProfile.avatarUrl,
      updatedAt: updatedProfile.updatedAt
    });



    const responseData = {
      success: true,
      message: 'Profile photo updated successfully',
      picture: photoUrl,
      updated_at: Math.floor(new Date(updatedProfile.updatedAt).getTime() / 1000)
    };
    
    
    const response = NextResponse.json(responseData);
    
    // Headers pour éviter le cache et forcer le rafraîchissement
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('💥 [PHOTO UPLOAD] Error occurred:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE - Supprimer photo de profil (OAuth)
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Access token required' 
      }, { status: 401 });
    }

    const accessToken = authHeader.substring(7);
    const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');

    // Vérifier le token d'accès
    const tokenRecord = await prisma.accessToken.findFirst({
      where: {
        tokenHash: tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });

    if (!tokenRecord) {
      return NextResponse.json({ 
        error: 'Invalid or expired access token' 
      }, { status: 401 });
    }

    const scopes = tokenRecord.scope?.split(' ') || [];
    
    if (!scopes.includes('profile')) {
      return NextResponse.json({ 
        error: 'Insufficient scope for profile modification' 
      }, { status: 403 });
    }

    // Supprimer la photo si elle existe
    if (tokenRecord.user.profile?.avatarUrl) {
      try {
        await StorageService.deleteProfilePhoto(tokenRecord.user.profile.avatarUrl);
      } catch (error) {
        console.warn('Failed to delete profile photo:', error);
      }
    }

    // Mettre à jour le profil pour supprimer l'URL
    const updatedProfile = await prisma.userProfile.update({
      where: { userId: tokenRecord.userId },
      data: {
        avatarUrl: null,
        updatedAt: new Date()
      }
    });





    return NextResponse.json({
      success: true,
      message: 'Profile photo deleted successfully',
      updated_at: Math.floor(new Date(updatedProfile.updatedAt).getTime() / 1000)
    });
  } catch (error) {
    console.error('Profile photo delete error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}