import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || query.length < 1) {
      return NextResponse.json({ 
        error: 'Query parameter q is required (minimum 1 character)' 
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
            country: true,
            metadata: true
          }
        }
      }
    });

    // Récupérer tous les clubs avec leur pays
    const allClubs = await prisma.user.findMany({
      where: {
        userType: 'club'
      },
      include: {
        profile: {
          select: {
            country: true
          }
        }
      }
    });

    // Créer un mapping club -> pays
    const clubCountryMap = new Map();
    allClubs.forEach(club => {
      if (club.profile?.country) {
        clubCountryMap.set(club.id, club.profile.country);
      }
    });

    // Extraire les pays selon la logique
    const countriesSet = new Set<string>();
    
    allPlayers.forEach(player => {
      const metadata = player.profile?.metadata as any;
      const playerCountry = player.profile?.country;
      const clubId = metadata?.clubId;

      if (clubId && clubCountryMap.has(clubId)) {
        // Si le joueur appartient à un club, utiliser le pays du club
        const clubCountry = clubCountryMap.get(clubId);
        if (clubCountry && clubCountry.toUpperCase().startsWith(query.toUpperCase())) {
          countriesSet.add(clubCountry);
        }
      } else if (playerCountry && playerCountry.toUpperCase().startsWith(query.toUpperCase())) {
        // Si le joueur n'appartient pas à un club, utiliser son pays d'origine
        countriesSet.add(playerCountry);
      }
    });

    const countryList = Array.from(countriesSet)
      .filter(country => country !== null && country !== undefined)
      .sort()
      .slice(0, Math.min(limit, 50));

    return NextResponse.json({
      countries: countryList,
      query: query.toUpperCase(),
      total: countryList.length
    });

  } catch (error) {
    console.error('Error searching countries:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}