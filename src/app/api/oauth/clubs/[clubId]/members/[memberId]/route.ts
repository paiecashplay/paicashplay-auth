import { NextRequest, NextResponse } from 'next/server';
import { requireOAuthScope } from '@/lib/oauth-middleware';
import { prisma } from '@/lib/prisma';

// PUT /api/oauth/clubs/[clubId]/members/[memberId] - Modifier un membre
export const PUT = requireOAuthScope(['clubs:write', 'users:write'])(async (
  request: NextRequest,
  context,
  routeParams
) => {
  const { params } = routeParams || { params: {} };
  if (!params?.clubId || !params?.memberId) {
    return NextResponse.json({ error: 'Club ID and Member ID required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { firstName, lastName, country, phone, height, weight, metadata = {} } = body;

    // Vérifier que le membre existe et appartient au club
    const member = await prisma.user.findFirst({
      where: {
        id: params.memberId,
        userType: 'player',
        profile: {
          metadata: {
            path: ['clubId'],
            equals: params.clubId
          }
        }
      },
      include: { profile: true }
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found in this club' }, { status: 404 });
    }

    // Mettre à jour le profil
    const updatedProfile = await prisma.userProfile.update({
      where: { userId: params.memberId },
      data: {
        firstName: firstName || member.profile?.firstName,
        lastName: lastName || member.profile?.lastName,
        country: country || member.profile?.country,
        phone: phone || member.profile?.phone,
        height: height !== undefined ? (height ? parseFloat(height) : null) : member.profile?.height,
        weight: weight !== undefined ? (weight ? parseFloat(weight) : null) : member.profile?.weight,
        metadata: {
          ...(member.profile?.metadata as Record<string, any> || {}),
          ...metadata,
          clubId: params.clubId, // Maintenir l'association au club
          clubName: (member.profile?.metadata as any)?.clubName
        }
      }
    });

    return NextResponse.json({
      member: {
        id: member.id,
        email: member.email,
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        country: updatedProfile.country,
        phone: updatedProfile.phone,
        height: updatedProfile.height,
        weight: updatedProfile.weight,
        isVerified: member.isVerified,
        metadata: updatedProfile.metadata
      }
    });

  } catch (error) {
    console.error('Update member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// DELETE /api/oauth/clubs/[clubId]/members/[memberId] - Retirer un membre du club
export const DELETE = requireOAuthScope(['clubs:write'])(async (
  request: NextRequest,
  context,
  routeParams
) => {
  const { params } = routeParams || { params: {} };
  if (!params?.clubId || !params?.memberId) {
    return NextResponse.json({ error: 'Club ID and Member ID required' }, { status: 400 });
  }

  try {
    // Vérifier que le membre existe et appartient au club
    const member = await prisma.user.findFirst({
      where: {
        id: params.memberId,
        userType: 'player',
        profile: {
          metadata: {
            path: ['clubId'],
            equals: params.clubId
          }
        }
      },
      include: { profile: true }
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found in this club' }, { status: 404 });
    }

    const currentMetadata = member.profile?.metadata as any || {};

    // Retirer l'association au club et ajouter à l'historique
    await prisma.userProfile.update({
      where: { userId: params.memberId },
      data: {
        metadata: {
          ...currentMetadata,
          // Retirer l'association actuelle
          clubId: null,
          clubName: null,
          status: 'free_agent',
          leftClubDate: new Date().toISOString(),
          
          // Ajouter à l'historique des clubs
          previousClubs: [
            ...(currentMetadata.previousClubs || []),
            {
              clubId: params.clubId,
              clubName: currentMetadata.clubName,
              joinDate: currentMetadata.joinDate || currentMetadata.createdAt,
              leftDate: new Date().toISOString(),
              position: currentMetadata.position,
              jerseyNumber: currentMetadata.jerseyNumber
            }
          ]
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Member removed from club successfully',
      member: {
        id: member.id,
        firstName: member.profile?.firstName,
        lastName: member.profile?.lastName,
        email: member.email,
        status: 'free_agent'
      }
    });

  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});