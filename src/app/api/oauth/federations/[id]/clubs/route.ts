import { NextRequest, NextResponse } from 'next/server';
import { requireOAuthScope } from '@/lib/oauth-middleware';
import { prisma } from '@/lib/prisma';

// GET /api/oauth/federations/[id]/clubs - Lister les clubs d'une fédération
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const handler = requireOAuthScope(['federations:read', 'clubs:read'])(async (req: NextRequest, context) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    try {
      // Vérifier que la fédération existe
      const federation = await prisma.user.findFirst({
        where: { 
          id: resolvedParams.id,
          userType: 'federation'
        },
        include: { profile: true }
      });

      if (!federation) {
        return NextResponse.json({ error: 'Federation not found' }, { status: 404 });
      }

      // Récupérer les clubs du même pays que la fédération
      const clubs = await prisma.user.findMany({
        where: {
          userType: 'club',
          profile: {
            country: federation.profile?.country
          }
        },
        include: {
          profile: true
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      const total = await prisma.user.count({
        where: {
          userType: 'club',
          profile: {
            country: federation.profile?.country
          }
        }
      });

      // Récupérer tous les joueurs pour compter les membres
      const allPlayers = await prisma.user.findMany({
        where: { userType: 'player' },
        include: { profile: true }
      });

      // Compter les membres de chaque club
      const clubsWithMemberCount = clubs.map((club) => {
        const memberCount = allPlayers.filter(player => {
          const metadata = player.profile?.metadata as any;
          return metadata?.clubId === club.id;
        }).length;

        return {
          id: club.id,
          name: club.profile?.firstName || club.email,
          league: (club.profile?.metadata as any)?.league,
          city: (club.profile?.metadata as any)?.city,
          membersCount: memberCount
        };
      });

      return NextResponse.json({
        federation: {
          id: federation.id,
          name: federation.profile?.firstName || federation.email,
          country: federation.profile?.country
        },
        clubs: clubsWithMemberCount,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get federation clubs error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });

  return handler(request);
}