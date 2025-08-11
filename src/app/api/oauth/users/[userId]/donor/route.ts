import { NextRequest, NextResponse } from 'next/server';
import { requireOAuthScope } from '@/lib/oauth-middleware';
import { prisma } from '@/lib/prisma';

// POST /api/oauth/users/[userId]/donor - Marquer un utilisateur comme donateur
export const POST = requireOAuthScope(['users:write'])(async (
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
    const { totalDonated = 0, preferredCauses = [], donorSince } = body;

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedProfile = await prisma.userProfile.update({
      where: { userId: params.userId },
      data: {
        metadata: {
          ...(user.profile?.metadata as Record<string, any> || {}),
          isDonor: true,
          donorSince: donorSince || new Date().toISOString(),
          totalDonated,
          preferredCauses,
          lastDonationUpdate: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        primaryType: user.userType,
        isDonor: true,
        donorInfo: {
          totalDonated,
          preferredCauses,
          donorSince: (updatedProfile.metadata as any)?.donorSince
        }
      }
    });

  } catch (error) {
    console.error('Mark as donor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// DELETE /api/oauth/users/[userId]/donor - Retirer le statut donateur
export const DELETE = requireOAuthScope(['users:write'])(async (
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
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.userType === 'donor') {
      return NextResponse.json({ 
        error: 'Cannot remove donor status from primary donor account' 
      }, { status: 400 });
    }

    const currentMetadata = user.profile?.metadata as any || {};
    const { isDonor, donorSince, totalDonated, preferredCauses, lastDonationUpdate, ...otherMetadata } = currentMetadata;

    await prisma.userProfile.update({
      where: { userId: params.userId },
      data: { metadata: otherMetadata }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        primaryType: user.userType,
        isDonor: false
      }
    });

  } catch (error) {
    console.error('Remove donor status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});