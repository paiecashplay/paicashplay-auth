import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value || cookieStore.get('session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user || user.userType !== 'affiliate') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { firstName, lastName, phone, country, avatarUrl, metadata } = body;

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        firstName,
        lastName,
        phone,
        country,
        avatarUrl,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined
      },
      create: {
        userId,
        firstName,
        lastName,
        phone,
        country,
        avatarUrl,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined
      }
    });

    return NextResponse.json({
      message: 'Profil mis à jour avec succès',
      profile: {
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        phone: updatedProfile.phone,
        country: updatedProfile.country,
        avatarUrl: updatedProfile.avatarUrl,
        metadata: updatedProfile.metadata
      }
    });

  } catch (error) {
    console.error('Ambassador profile update error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}