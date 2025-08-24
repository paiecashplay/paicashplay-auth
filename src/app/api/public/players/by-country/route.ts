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
        profile: {
          country: {
            in: countryVariants
          }
        }
      },
      select: {
        id: true
      }
    });

    const clubIdsInCountry = clubsInCountry.map(club => club.id);

    // Filtrer les joueurs selon la logique demandée
    const filteredPlayers = allPlayers.filter(player => {
      const metadata = player.profile?.metadata as any;
      const playerCountry = player.profile?.country;
      const clubId = metadata?.clubId;


      if (clubId) {
        // Si le joueur appartient à un club, vérifier que le club est dans le pays
        const isInCountryClub = clubIdsInCountry.includes(clubId);
        return isInCountryClub;
      } else {
        // Si le joueur n'appartient pas à un club, vérifier son pays d'origine
        return countryVariants.includes(playerCountry || '');
      }
    });

    // Appliquer la pagination
    const players = filteredPlayers.slice(offset, offset + Math.min(limit, 100));

    const total = filteredPlayers.length;
    const formattedPlayers = players.map(player => ({
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
        name: (player.profile?.metadata as any)?.clubName || 'Club non spécifié'
      } : null,
      status: (player.profile?.metadata as any)?.status || 'active',
      // Toutes les métadonnées
      metadata: player.profile?.metadata
    }));

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