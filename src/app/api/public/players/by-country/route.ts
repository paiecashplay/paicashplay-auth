import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCountryVariants } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!country) {
      return NextResponse.json({ 
        error: 'Country parameter is required' 
      }, { status: 400 });
    }

    // Récupérer tous les joueurs actifs et vérifiés
    const allPlayers = await prisma.user.findMany({
      where: {
        userType: 'player',
        isActive: true,
        isVerified: true
      },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            country: true,
            phone: true,
            language: true,
            avatarUrl: true,
            height: true,
            weight: true,
            metadata: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Récupérer les clubs du pays demandé (avec toutes les variantes)
    const countryVariants = getCountryVariants(country);
    const clubsInCountry = await prisma.user.findMany({
      where: {
        userType: 'club',
        isActive: true,
        profile: {
          country: {
            in: countryVariants
          }
        }
      },
      include: {
        profile: {
          select: {
            country: true,
            metadata: true
          }
        }
      }
    });

    // Créer un Set des noms de clubs dans le pays
    const clubNamesInCountry = new Set<string>();
    clubsInCountry.forEach(club => {
      const metadata = club.profile?.metadata as any;
      const organizationName = metadata?.organizationName;
      if (organizationName) {
        clubNamesInCountry.add(organizationName);
      }
    });

    // Filtrer les joueurs selon la logique demandée
    const filteredPlayers = allPlayers.filter(player => {
      const metadata = player.profile?.metadata as any;
      const playerCountry = player.profile?.country;
      const clubName = metadata?.club;

      if (clubName && typeof clubName === 'string' && clubName.trim() !== '') {
        // Si le joueur appartient à un club, vérifier que le club est dans le pays
        return clubNamesInCountry.has(clubName);
      } else {
        // Si le joueur n'appartient pas à un club, vérifier son pays d'origine
        return countryVariants.includes(playerCountry || '');
      }
    });

    // Appliquer la pagination
    const players = filteredPlayers.slice(offset, offset + Math.min(limit, 100));

    const total = filteredPlayers.length;
    
    // Créer un mapping nom du club -> pays pour l'affichage
    const clubCountryMap = new Map<string, string>();
    const uniqueClubNames = [...new Set(players.map(p => (p.profile?.metadata as any)?.club).filter(Boolean))];
    
    if (uniqueClubNames.length > 0) {
      const clubsForMapping = await prisma.user.findMany({
        where: {
          userType: 'club',
          isActive: true
        },
        include: {
          profile: {
            select: {
              country: true,
              metadata: true
            }
          }
        }
      });
      
      clubsForMapping.forEach(club => {
        const metadata = club.profile?.metadata as any;
        const organizationName = metadata?.organizationName;
        if (organizationName && uniqueClubNames.includes(organizationName) && club.profile?.country) {
          clubCountryMap.set(organizationName, club.profile.country);
        }
      });
    }

    const formattedPlayers = players.map(player => {
      const metadata = player.profile?.metadata as any;
      const clubName = metadata?.club;
      
      // Déterminer le pays effectif
      const effectiveCountry = clubName && clubCountryMap.has(clubName) 
        ? clubCountryMap.get(clubName) 
        : player.profile?.country;
      
      return {
        id: player.id,
        email: player.email,
        firstName: player.profile?.firstName,
        lastName: player.profile?.lastName,
        phone: player.profile?.phone,
        country: effectiveCountry,
        language: player.profile?.language,
        avatarUrl: player.profile?.avatarUrl,
        height: player.profile?.height,
        weight: player.profile?.weight,
        isVerified: player.isVerified,
        isActive: player.isActive,
        createdAt: player.createdAt,
        updatedAt: player.updatedAt,
        // Informations spécifiques au joueur
        position: metadata?.position,
        dateOfBirth: metadata?.dateOfBirth,
        club: clubName ? {
          name: clubName,
          country: clubCountryMap.get(clubName) || null
        } : null,
        status: metadata?.status || 'active',
        // Toutes les métadonnées
        metadata: player.profile?.metadata
      };
    });

    return NextResponse.json({
      players: formattedPlayers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching players by country:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}