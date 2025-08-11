import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// OPTIONS /api/public/clubs - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// GET /api/public/clubs - Liste publique des clubs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const league = searchParams.get('league');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const where: any = { userType: 'club' };
    const filters: any[] = [];

    if (country) {
      where.profile = { country };
    }

    if (league) {
      filters.push({
        profile: {
          metadata: {
            path: '$.league',
            equals: league
          }
        }
      });
    }

    if (filters.length > 0) {
      where.AND = filters;
    }

    const clubs = await prisma.user.findMany({
      where,
      include: { profile: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where });

    const response = NextResponse.json({
      clubs: clubs.map(club => ({
        id: club.id,
        name: club.profile?.firstName || club.email,
        country: club.profile?.country,
        phone: club.profile?.phone,
        isVerified: club.isVerified,
        createdAt: club.createdAt,
        metadata: {
          league: (club.profile?.metadata as any)?.league,
          founded: (club.profile?.metadata as any)?.founded,
          stadium: (club.profile?.metadata as any)?.stadium,
          website: (club.profile?.metadata as any)?.website
        }
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;

  } catch (error) {
    console.error('Public clubs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}