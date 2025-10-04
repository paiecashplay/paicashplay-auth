import { NextRequest, NextResponse } from 'next/server';
import { requireOAuthScope } from '@/lib/oauth-middleware';
import { prisma } from '@/lib/prisma';
import { getCountryVariants } from '@/lib/utils';

// GET /api/oauth/clubs - Lister les clubs
export const GET = requireOAuthScope(['clubs:read'])(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const federation = searchParams.get('federation');
  const league = searchParams.get('league');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

  const where: any = { userType: 'club' };
  
  if (country || federation || league) {
    where.profile = {};
    if (country) {
      const countryVariants = getCountryVariants(country);
      where.profile.country = {
        in: countryVariants
      };
    }
    
    if (league) {
      where.profile.metadata = {
        path: ['league'],
        equals: league
      };
    }
  }

  const clubs = await prisma.user.findMany({
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
    clubs: clubs.map(club => {
      const metadata = club.profile?.metadata as any;
      return {
        id: club.id,
        email: club.email,
        name: metadata?.organizationName || club.email,
        country: club.profile?.country,
        phone: club.profile?.phone,
        isVerified: club.isVerified,
        isActive: club.isActive,
        createdAt: club.createdAt,
        updatedAt: club.updatedAt,
        metadata: metadata
      };
    }),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});