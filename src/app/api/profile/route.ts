import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { SessionSyncService } from '@/lib/session-sync';
import { ClubManagementService } from '@/lib/club-management';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const userWithProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        socialAccounts: {
          include: {
            provider: {
              select: {
                name: true,
                displayName: true,
                type: true
              }
            }
          }
        }
      }
    });

    if (!userWithProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: userWithProfile.id,
        email: userWithProfile.email,
        userType: userWithProfile.userType,
        isVerified: userWithProfile.isVerified,
        createdAt: userWithProfile.createdAt,
        profile: userWithProfile.profile,
        socialAccounts: userWithProfile.socialAccounts.map(account => ({
          provider: account.provider.displayName,
          type: account.provider.type,
          email: account.email,
          name: account.name,
          avatar: account.avatar
        }))
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const PUT = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      phone, 
      country, 
      language,
      height,
      weight,
      avatarUrl,
      metadata 
    } = body;

    // Récupérer le profil actuel pour détecter les changements de club
    const currentProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id }
    });

    const currentClub = (currentProfile?.metadata as any)?.club;
    const newClub = metadata?.club;
    const clubChanged = currentClub !== newClub;

    // Validation pour les joueurs
    if (user.userType === 'player' && metadata) {
      const { position, dateOfBirth } = metadata;
      
      if (position && !['goalkeeper', 'defender', 'midfielder', 'forward'].includes(position)) {
        return NextResponse.json({ 
          error: 'Invalid position. Must be: goalkeeper, defender, midfielder, forward' 
        }, { status: 400 });
      }
      
      if (dateOfBirth) {
        const birthDate = new Date(dateOfBirth);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        if (age < 6 || age > 40) {
          return NextResponse.json({ 
            error: 'Age must be between 6 and 40 years' 
          }, { status: 400 });
        }
      }
    }

    // Mettre à jour le profil avec toutes les données
    const updatedProfile = await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        firstName,
        lastName,
        phone: phone || null,
        country: country || null,
        language: language || null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        avatarUrl: avatarUrl || null,
        metadata: metadata || null,
        updatedAt: new Date()
      }
    });

    // Si le club a changé et que l'utilisateur est un joueur, mettre à jour les statistiques des clubs
    if (clubChanged && user.userType === 'player') {
      await ClubManagementService.handlePlayerClubChange(user.id, currentClub, newClub);
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      clubChanged
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});