import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage-service';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    if (!payload?.sub) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Validation du fichier
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 5MB)' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non supporté' }, { status: 400 });
    }

    // Récupérer l'ancienne photo pour la supprimer
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: payload.sub },
      select: { avatarUrl: true }
    });

    // Upload vers Google Cloud Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const photoUrl = await StorageService.uploadProfilePhoto(
      payload.sub,
      buffer,
      file.name
    );

    // Mettre à jour la base de données
    await prisma.userProfile.update({
      where: { userId: payload.sub },
      data: { avatarUrl: photoUrl }
    });

    // Supprimer l'ancienne photo si elle existe
    if (userProfile?.avatarUrl) {
      try {
        await StorageService.deleteProfilePhoto(userProfile.avatarUrl);
      } catch (error) {
        console.warn('Erreur lors de la suppression de l\'ancienne photo:', error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      avatarUrl: photoUrl 
    });

  } catch (error) {
    console.error('Erreur upload photo:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'upload' 
    }, { status: 500 });
  }
}