import { NextRequest, NextResponse } from 'next/server';
import { requireOAuthScope } from '@/lib/oauth-middleware';
import { prisma } from '@/lib/prisma';
import { StorageService } from '@/lib/storage-service';
import { SessionSyncService } from '@/lib/session-sync';

// GET /api/oauth/profile - Obtenir le profil de l'utilisateur connecté
export const GET = requireOAuthScope(['profile:read'])(async (
  request: NextRequest,
  context
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: context.user.id },
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profile: user.profile ? {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          country: user.profile.country,
          phone: user.profile.phone,
          language: user.profile.language,
          avatarUrl: SessionSyncService.getAvatarUrl(user.profile, user.socialAccounts),
          height: user.profile.height,
          weight: user.profile.weight,
          isPartner: user.profile.isPartner,
          metadata: user.profile.metadata,
          updatedAt: user.profile.updatedAt
        } : null,
        socialAccounts: user.socialAccounts.map(account => ({
          provider: account.provider.name,
          providerType: account.provider.type,
          linkedAt: account.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// PUT /api/oauth/profile - Mettre à jour le profil de l'utilisateur connecté
export const PUT = requireOAuthScope(['profile:write'])(async (
  request: NextRequest,
  context
) => {
  try {
    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      country, 
      phone, 
      language,
      avatarUrl,
      height,
      weight,
      metadata = {} 
    } = body;

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: context.user.id },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (country !== undefined) updateData.country = country;
    if (phone !== undefined) updateData.phone = phone;
    if (language !== undefined) updateData.language = language;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (height !== undefined) updateData.height = height;
    if (weight !== undefined) updateData.weight = weight;
    
    // Fusionner les métadonnées existantes avec les nouvelles
    if (Object.keys(metadata).length > 0) {
      updateData.metadata = {
        ...(user.profile?.metadata as Record<string, any> || {}),
        ...metadata
      };
    }

    // Mettre à jour le profil
    const updatedProfile = await prisma.userProfile.update({
      where: { userId: context.user.id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });



    return NextResponse.json({
      success: true,
      profile: {
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        country: updatedProfile.country,
        phone: updatedProfile.phone,
        language: updatedProfile.language,
        avatarUrl: updatedProfile.avatarUrl,
        height: updatedProfile.height,
        weight: updatedProfile.weight,
        isPartner: updatedProfile.isPartner,
        metadata: updatedProfile.metadata,
        updatedAt: updatedProfile.updatedAt
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});