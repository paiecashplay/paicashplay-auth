import { NextRequest, NextResponse } from 'next/server';
import { requireOAuthScope } from '@/lib/oauth-middleware';
import { prisma } from '@/lib/prisma';

// GET /api/oauth/stats/clubs/[id] - Statistiques d'un club
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const handler = requireOAuthScope(['clubs:read'])(async (req: NextRequest, context) => {
    try {
      // Vérifier que le club existe
      const club = await prisma.user.findFirst({
        where: { 
          id: params.id,
          userType: 'club'
        },
        include: { profile: true }
      });

      if (!club) {
        return NextResponse.json({ error: 'Club not found' }, { status: 404 });
      }

      // Récupérer tous les membres du club
      const members = await prisma.user.findMany({
        where: {
          userType: 'player',
          profile: {
            metadata: {
              path: ['clubId'],
              equals: params.id
            }
          }
        },
        include: { profile: true }
      });

      // Calculer les statistiques
      const totalMembers = members.length;
      
      const membersByPosition = members.reduce((acc, member) => {
        const position = member.profile?.metadata?.position || 'unknown';
        acc[position] = (acc[position] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const membersByStatus = members.reduce((acc, member) => {
        const status = member.profile?.metadata?.status || 'active';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculer l'âge moyen (approximatif)
      const ages = members
        .map(member => {
          const birthDate = member.profile?.metadata?.birthDate;
          if (birthDate) {
            const birth = new Date(birthDate);
            const today = new Date();
            return today.getFullYear() - birth.getFullYear();
          }
          return null;
        })
        .filter(age => age !== null) as number[];

      const averageAge = ages.length > 0 
        ? Math.round((ages.reduce((sum, age) => sum + age, 0) / ages.length) * 10) / 10
        : null;

      // Distribution par nationalité
      const nationalityDistribution = members.reduce((acc, member) => {
        const country = member.profile?.country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return NextResponse.json({
        club: {
          id: club.id,
          name: club.profile?.firstName || club.email,
          country: club.profile?.country
        },
        statistics: {
          totalMembers,
          membersByPosition,
          membersByStatus,
          averageAge,
          nationalityDistribution
        }
      });
    } catch (error) {
      console.error('Get club stats error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });

  return handler(request);
}