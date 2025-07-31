import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth-service';

// PUT - Mettre à jour le profil utilisateur (interne)
export async function PUT(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authResult = await AuthService.validateSession(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ 
        error: 'Non authentifié' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, phone, country, language } = body;

    // Mettre à jour le profil
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId: authResult.user.id },
      create: {
        userId: authResult.user.id,
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || null,
        country: country || null,
        language: language || 'fr'
      },
      update: {
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || null,
        country: country || null,
        language: language || 'fr'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur interne' 
    }, { status: 500 });
  }
}