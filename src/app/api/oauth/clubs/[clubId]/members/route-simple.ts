import { NextRequest, NextResponse } from 'next/server';
import { requireOAuthScope } from '@/lib/oauth-middleware';
import { prisma } from '@/lib/prisma';

// GET /api/oauth/clubs/[clubId]/members - Version simplifiée
export const GET = requireOAuthScope(['clubs:members'])(async (
  request: NextRequest, 
  context,
  routeParams
) => {
  const { params } = routeParams || { params: {} };
  if (!params?.clubId) {
    return NextResponse.json({ error: 'Club ID required' }, { status: 400 });
  }
  
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

  try {
    // Verify club exists
    const club = await prisma.user.findFirst({
      where: { 
        id: params.clubId,
        userType: 'club'
      },
      include: { profile: true }
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Get all players and filter in JavaScript (temporary solution)
    const allPlayers = await prisma.user.findMany({
      where: { userType: 'player' },
      include: { profile: true }
    });

    // Filter players that belong to this club
    const members = allPlayers.filter(player => {
      const metadata = player.profile?.metadata as any;
      return metadata?.clubId === params.clubId;
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedMembers = members.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      club: {
        id: club.id,
        name: club.profile?.firstName || club.email
      },
      members: paginatedMembers.map(member => ({
        id: member.id,
        email: member.email,
        firstName: member.profile?.firstName,
        lastName: member.profile?.lastName,
        country: member.profile?.country,
        phone: member.profile?.phone,
        isVerified: member.isVerified,
        createdAt: member.createdAt,
        metadata: member.profile?.metadata
      })),
      pagination: {
        page,
        limit,
        total: members.length,
        pages: Math.ceil(members.length / limit)
      }
    });

  } catch (error) {
    console.error('Get members error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});