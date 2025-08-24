import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
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
        countriesSet.add(clubCountryMap.get(clubId));
      } else if (playerCountry) {
        // Si le joueur n'appartient pas à un club, utiliser son pays d'origine
        countriesSet.add(playerCountry);
      }
    });

    const countryList = Array.from(countriesSet)
      .filter(country => country !== null && country !== undefined)
      .sort();

    return NextResponse.json({
      countries: countryList,
      total: countryList.length
    });

  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}