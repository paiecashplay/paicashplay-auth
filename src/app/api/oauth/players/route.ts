import { NextRequest, NextResponse } from 'next/server';
import { requireOAuthScope } from '@/lib/oauth-middleware';
import { prisma } from '@/lib/prisma';

// GET /api/oauth/players - Lister les joueurs
export const GET = requireOAuthScope(['players:read'])(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const clubId = searchParams.get('club_id');
  const position = searchParams.get('position');
  const ageMin = searchParams.get('age_min');
  const ageMax = searchParams.get('age_max');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

  const where: any = { userType: 'player' };
  
  if (country || clubId || position || status || ageMin || ageMax) {
    where.profile = {};
    if (country) where.profile.country = country;
    
    // Filtres sur les métadonnées
    const metadataFilters: any = {};
    if (clubId) metadataFilters.clubId = clubId;
    if (position) metadataFilters.position = position;
    if (status) metadataFilters.status = status;
    
    if (Object.keys(metadataFilters).length > 0) {
      where.profile.metadata = {
        path: Object.keys(metadataFilters),
        array_contains: Object.values(metadataFilters)
      };
    }
    
    // Filtre par âge (approximatif basé sur birthDate)
    if (ageMin || ageMax) {
      const currentYear = new Date().getFullYear();
      if (ageMin) {
        const maxBirthYear = currentYear - parseInt(ageMin);
        where.profile.metadata = {
          ...where.profile.metadata,
          path: ['birthDate'],
          lte: `${maxBirthYear}-12-31`
        };
      }
      if (ageMax) {
        const minBirthYear = currentYear - parseInt(ageMax);
        where.profile.metadata = {
          ...where.profile.metadata,
          path: ['birthDate'],
          gte: `${minBirthYear}-01-01`
        };
      }
    }
  }

  const players = await prisma.user.findMany({
    where,
    include: {
      profile: true
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  const total = await prisma.user.count({ where });

  return NextResponse.json({
    players: players.map(player => ({
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
      metadata: player.profile?.metadata
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});