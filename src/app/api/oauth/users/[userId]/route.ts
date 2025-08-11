import { NextRequest, NextResponse } from 'next/server';
import { requireOAuthScope } from '@/lib/oauth-middleware';
import { prisma } from '@/lib/prisma';

// GET /api/oauth/users/[userId] - Obtenir un utilisateur spécifique
export const GET = requireOAuthScope(['users:read'])(async (
  request: NextRequest,
  context,
  routeParams
) => {
  const { params } = routeParams || { params: {} };
  if (!params?.userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
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
          avatarUrl: user.profile.avatarUrl,
          metadata: user.profile.metadata
        } : null,
        socialAccounts: user.socialAccounts.map(account => ({
          provider: account.provider.name,
          providerType: account.provider.type,
          linkedAt: account.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// PUT /api/oauth/users/[userId] - Modifier un utilisateur
export const PUT = requireOAuthScope(['users:write'])(async (
  request: NextRequest,
  context,
  routeParams
) => {
  const { params } = routeParams || { params: {} };
  if (!params?.userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { firstName, lastName, country, phone, metadata = {} } = body;

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Mettre à jour le profil
    const updatedProfile = await prisma.userProfile.update({
      where: { userId: params.userId },
      data: {
        firstName: firstName || user.profile?.firstName,
        lastName: lastName || user.profile?.lastName,
        country: country || user.profile?.country,
        phone: phone || user.profile?.phone,
        metadata: {
          ...(user.profile?.metadata as Record<string, any> || {}),
          ...metadata
        }
      }
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified,
        profile: {
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
          country: updatedProfile.country,
          phone: updatedProfile.phone,
          metadata: updatedProfile.metadata
        }
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});