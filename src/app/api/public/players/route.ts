import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCountryVariants } from '@/lib/utils';
import { FederationService } from '@/lib/federations';

// OPTIONS /api/public/players - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
            path: ['position'],
            equals: position
          }
        }
      });
    }



    // Récupérer tous les joueurs avec les informations des clubs
    const allPlayers = await prisma.user.findMany({
      where,
      include: { profile: true },
      orderBy: { createdAt: 'desc' }
    });

    // Récupérer les informations des clubs pour enrichir les données
    const clubNames = new Set<string>();
    allPlayers.forEach(player => {
      const clubName = (player.profile?.metadata as any)?.club;
      if (clubName) {
        clubNames.add(clubName);
      } else {
        // Ajouter le club par défaut pour les joueurs sans club
        clubNames.add('PaieCashPlay Club');
      }
    });

    const clubsInfo = await prisma.user.findMany({
      where: {
        userType: 'club'
      },
      include: { profile: true }
    });

    const clubsMap = new Map();
    clubsInfo.forEach(club => {
      const orgName = (club.profile?.metadata as any)?.organizationName;
      if (orgName && clubNames.has(orgName)) {
        const clubCountry = club.profile?.country;
        const federation = FederationService.getFederationByCountry(clubCountry || '');
        
        clubsMap.set(orgName, {
          id: club.id,
          name: orgName,
          country: clubCountry,
          federation: federation?.name || (club.profile?.metadata as any)?.federation,
          email: club.email,
          phone: club.profile?.phone,
          isVerified: club.isVerified,
          createdAt: club.createdAt
        });
      }
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
        const clubName = metadata?.club;

        if (clubId) {
          return clubIdsInCountry.includes(clubId);
        } else if (clubName && clubName !== 'PaieCashPlay Club') {
          // Si le joueur a un club spécifique, vérifier le pays du club
          return false; // Pour l'instant, on ne peut pas déterminer le pays
        } else {
          // Pour les joueurs sans club (PaieCashPlay Club) ou avec club par défaut,
          // utiliser le pays du joueur
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
        age: (player.profile?.metadata as any)?.dateOfBirth ? (() => {
          const birthDate = new Date((player.profile?.metadata as any).dateOfBirth);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          return age;
        })() : null,
        preferredFoot: (player.profile?.metadata as any)?.preferredFoot,
        jerseyNumber: (player.profile?.metadata as any)?.jerseyNumber,
        nationality: (player.profile?.metadata as any)?.nationality,
        placeOfBirth: (player.profile?.metadata as any)?.placeOfBirth,
        experience: (player.profile?.metadata as any)?.experience,
        previousClubs: (player.profile?.metadata as any)?.previousClubs || [],
        achievements: (player.profile?.metadata as any)?.achievements || [],
        club: (() => {
          const clubName = (player.profile?.metadata as any)?.club;
          if (clubName && clubName !== 'Club non renseigné' && clubsMap.has(clubName)) {
            return clubsMap.get(clubName);
          } else if (clubName && clubName !== 'Club non renseigné' && clubName !== 'PaieCashPlay Club') {
            // Pour les clubs non référencés, utiliser le pays du joueur pour déterminer la fédération
            const playerCountry = player.profile?.country;
            const federation = FederationService.getFederationByCountry(playerCountry || '');
            
            return {
              id: null,
              name: clubName,
              country: playerCountry,
              federation: federation?.name || null,
              email: null,
              phone: null,
              isVerified: false,
              createdAt: null
            };
          }
          // Club par défaut pour les joueurs sans club ou avec "Club non renseigné"
          return {
            id: 'default',
            name: 'PaieCashPlay Club',
            country: null,
            federation: 'PaieCashPlay Foundation',
            email: 'club@paiecashplay.com',
            phone: null,
            isVerified: true,
            createdAt: null
          };
        })(),
        status: (player.profile?.metadata as any)?.status || 'active',
        // Métadonnées complètes
        metadata: player.profile?.metadata
      })).filter(player => player !== null),
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
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;

  } catch (error) {
    console.error('Public players error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}