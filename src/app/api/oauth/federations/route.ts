import { NextRequest, NextResponse } from 'next/server';
import { requireOAuthScope } from '@/lib/oauth-middleware';
import { prisma } from '@/lib/prisma';

// GET /api/oauth/federations - Lister les fédérations
export const GET = requireOAuthScope(['federations:read'])(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const continent = searchParams.get('continent');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

  const where: any = { userType: 'federation' };
  
  if (country || continent) {
    where.profile = {};
    if (country) where.profile.country = country;
    if (continent) {
      where.profile.metadata = {
        path: ['continent'],
        equals: continent
      };
    }
  }

  const federations = await prisma.user.findMany({
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
    federations: federations.map(federation => ({
      id: federation.id,
      email: federation.email,
      name: federation.profile?.firstName || federation.email,
      country: federation.profile?.country,
      isVerified: federation.isVerified,
      createdAt: federation.createdAt,
      metadata: federation.profile?.metadata
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});