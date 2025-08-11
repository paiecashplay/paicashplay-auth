import { NextRequest, NextResponse } from 'next/server';
import { requireOAuthScope } from '@/lib/oauth-middleware';
import { prisma } from '@/lib/prisma';

// GET /api/oauth/players/[id] - Obtenir un joueur spécifique
export const GET = requireOAuthScope(['players:read'])(async (
  request: NextRequest,
  context,
  routeParams
) => {
  const { params } = routeParams || { params: {} };
  if (!params?.id) {
    return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
  }
  try {
    const player = await prisma.user.findFirst({
        where: {
          id: params.id,
          userType: 'player'
        },
        include: {
          profile: true
        }
      });

      if (!player) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }

      return NextResponse.json({
        player: {
          id: player.id,
          email: player.email,
          firstName: player.profile?.firstName,
          lastName: player.profile?.lastName,
          country: player.profile?.country,
          phone: player.profile?.phone,
          isVerified: player.isVerified,
          createdAt: player.createdAt,
          club: (player.profile?.metadata as any)?.clubId ? {
            id: (player.profile?.metadata as any).clubId,
            name: (player.profile?.metadata as any).clubName
          } : null,
          profile: {
            phone: player.profile?.phone,
            metadata: player.profile?.metadata
          }
        }
      });
  } catch (error) {
    console.error('Get player error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});