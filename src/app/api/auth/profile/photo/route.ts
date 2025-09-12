import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { StorageService } from '@/lib/storage-service';
import crypto from 'crypto';

// POST - Upload photo de profil (OAuth)
export async function POST(request: NextRequest) {
  console.log('🔄 [PHOTO UPLOAD] Starting photo upload process');
  
  try {
    const authHeader = request.headers.get('authorization');
    console.log('🔑 [PHOTO UPLOAD] Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [PHOTO UPLOAD] Missing or invalid auth header');
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

    console.log('👤 [PHOTO UPLOAD] Token record found:', !!tokenRecord);
    if (tokenRecord) {
      console.log('👤 [PHOTO UPLOAD] User ID:', tokenRecord.userId);
      console.log('👤 [PHOTO UPLOAD] Current avatar URL:', tokenRecord.user.profile?.avatarUrl);
    }

    if (!tokenRecord) {
      console.log('❌ [PHOTO UPLOAD] Invalid or expired token');
      return NextResponse.json({ 
        error: 'Invalid or expired access token' 
      }, { status: 401 });
    }

    const scopes = tokenRecord.scope?.split(' ') || [];
    console.log('🔐 [PHOTO UPLOAD] Token scopes:', scopes);
    
    // Vérifier que l'application a les permissions pour modifier le profil
    if (!scopes.includes('profile')) {
      console.log('❌ [PHOTO UPLOAD] Insufficient scope');
      return NextResponse.json({ 
        error: 'Insufficient scope for profile modification' 
      }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File;
    console.log('📁 [PHOTO UPLOAD] File received:', !!file);

    if (!file) {
      console.log('❌ [PHOTO UPLOAD] No file provided');
      return NextResponse.json({ 
        error: 'No photo file provided' 
      }, { status: 400 });
    }

    console.log('📁 [PHOTO UPLOAD] File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ [PHOTO UPLOAD] Invalid file type:', file.type);
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF and WebP are allowed' 
      }, { status: 400 });
    }

    // Vérifier la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.log('❌ [PHOTO UPLOAD] File too large:', file.size);
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB' 
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('📦 [PHOTO UPLOAD] Buffer created, size:', buffer.length);
    
    // Supprimer l'ancienne photo si elle existe
    if (tokenRecord.user.profile?.avatarUrl) {
      console.log('🗑️ [PHOTO UPLOAD] Deleting old photo:', tokenRecord.user.profile.avatarUrl);
      try {
        await StorageService.deleteProfilePhoto(tokenRecord.user.profile.avatarUrl);
        console.log('✅ [PHOTO UPLOAD] Old photo deleted successfully');
      } catch (error) {
        console.warn('⚠️ [PHOTO UPLOAD] Failed to delete old profile photo:', error);
      }
    }

    // Upload la nouvelle photo
    console.log('☁️ [PHOTO UPLOAD] Starting upload to Google Cloud Storage...');
    const photoUrl = await StorageService.uploadProfilePhoto(
      tokenRecord.userId,
      buffer,
      file.name
    );
    console.log('✅ [PHOTO UPLOAD] Photo uploaded successfully:', photoUrl);

    // Mettre à jour le profil avec la nouvelle URL (remplace l'avatar social)
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
        avatarUrl: photoUrl
      }
    });
    
    console.log('✅ [PHOTO UPLOAD] Profile updated in database:', {
      userId: updatedProfile.userId,
      avatarUrl: updatedProfile.avatarUrl,
      updatedAt: updatedProfile.updatedAt
    });

    const response = {
      success: true,
      message: 'Profile photo updated successfully',
      picture: photoUrl,
      updated_at: Math.floor(new Date(updatedProfile.updatedAt).getTime() / 1000)
    };
    
    console.log('📤 [PHOTO UPLOAD] Sending response:', response);
    return NextResponse.json(response);
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
        avatarUrl: null
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