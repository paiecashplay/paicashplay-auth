import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// PUT - Mettre à jour le profil utilisateur (session interne)
export async function PUT(request: NextRequest) {
  try {
    // Vérifier la session utilisateur
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ 
        error: 'Non authentifié' 
      }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ 
        error: 'Session invalide' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, phone, country, language } = body;

    // Mettre à jour le profil
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone || null;
    if (country !== undefined) updateData.country = country || null;
    if (language !== undefined) updateData.language = language;

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || null,
        country: country || null,
        language: language || 'fr'
      },
      update: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur' 
    }, { status: 500 });
  }
}