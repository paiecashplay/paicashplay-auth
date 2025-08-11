import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// OPTIONS /api/public/players - CORS preflight
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

// GET /api/public/players - Liste publique des joueurs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const position = searchParams.get('position');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const where: any = { userType: 'player' };
    const filters: any[] = [];

    if (country) {
      where.profile = { country };
    }

    if (position) {
      filters.push({
        profile: {
          metadata: {
            path: '$.position',
            equals: position
          }
        }
      });
    }

    if (filters.length > 0) {
      where.AND = filters;
    }

    const players = await prisma.user.findMany({
      where,
      include: { profile: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where });

    const response = NextResponse.json({
      players: players.map(player => ({
        id: player.id,
        firstName: player.profile?.firstName,
        lastName: player.profile?.lastName,
        country: player.profile?.country,
        isVerified: player.isVerified,
        club: (player.profile?.metadata as any)?.clubId ? {
          id: (player.profile?.metadata as any).clubId,
          name: (player.profile?.metadata as any).clubName
        } : null,
        position: (player.profile?.metadata as any)?.position,
        status: (player.profile?.metadata as any)?.status || 'active'
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;

  } catch (error) {
    console.error('Public players error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}