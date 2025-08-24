import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCountryVariants } from '@/lib/utils';

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

    const where: any = { 
      userType: 'player',
      isActive: true,
      isVerified: true
    };
    const filters: any[] = [];

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



    // Récupérer tous les joueurs
    const allPlayers = await prisma.user.findMany({
      where,
      include: { profile: true },
      orderBy: { createdAt: 'desc' }
    });

    // Appliquer les filtres
    let filteredPlayers = allPlayers;

    if (country) {
      // Récupérer les clubs du pays avec toutes les variantes
      const countryVariants = getCountryVariants(country);
      const clubsInCountry = await prisma.user.findMany({
        where: {
          userType: 'club',
          profile: {
            country: {
              in: countryVariants
            }
          }
        },
        select: { id: true }
      });

      const clubIdsInCountry = clubsInCountry.map(club => club.id);

      filteredPlayers = allPlayers.filter(player => {
        const metadata = player.profile?.metadata as any;
        const playerCountry = player.profile?.country;
        const clubId = metadata?.clubId;

        if (clubId) {
          return clubIdsInCountry.includes(clubId);
        } else {
          return countryVariants.includes(playerCountry || '');
        }
      });
    }

    if (position) {
      filteredPlayers = filteredPlayers.filter(player => {
        const metadata = player.profile?.metadata as any;
        return metadata?.position === position;
      });
    }

    const total = filteredPlayers.length;
    const players = filteredPlayers.slice((page - 1) * limit, page * limit);

    const response = NextResponse.json({
      players: players.map(player => ({
        id: player.id,
        email: player.email,
        firstName: player.profile?.firstName,
        lastName: player.profile?.lastName,
        phone: player.profile?.phone,
        country: player.profile?.country,
        language: player.profile?.language,
        avatarUrl: player.profile?.avatarUrl,
        height: player.profile?.height,
        weight: player.profile?.weight,
        isVerified: player.isVerified,
        isActive: player.isActive,
        createdAt: player.createdAt,
        updatedAt: player.updatedAt,
        // Informations spécifiques au joueur
        position: (player.profile?.metadata as any)?.position,
        dateOfBirth: (player.profile?.metadata as any)?.dateOfBirth,
        club: (player.profile?.metadata as any)?.clubId ? {
          id: (player.profile?.metadata as any)?.clubId,
          name: (player.profile?.metadata as any)?.organizationName || 
                (player.profile?.metadata as any)?.clubName || 
                (player.profile?.metadata as any)?.club || 
                'Club non spécifié'
        } : null,
        status: (player.profile?.metadata as any)?.status || 'active',
        // Toutes les métadonnées
        metadata: player.profile?.metadata
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