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

    // Récupérer tous les clubs avec leur pays et nom d'organisation
    const allClubs = await prisma.user.findMany({
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

    // Créer un mapping nom du club -> pays
    const clubCountryMap = new Map<string, string>();
    allClubs.forEach(club => {
      const metadata = club.profile?.metadata as any;
      const organizationName = metadata?.organizationName;
      if (organizationName && club.profile?.country) {
        clubCountryMap.set(organizationName, club.profile.country);
      }
    });

    // Extraire les pays selon la logique
    const countriesSet = new Set<string>();
    
    allPlayers.forEach(player => {
      const metadata = player.profile?.metadata as any;
      const playerCountry = player.profile?.country;
      const clubName = metadata?.club;

      if (clubName && typeof clubName === 'string' && clubName.trim() !== '' && clubCountryMap.has(clubName)) {
        // Si le joueur appartient à un club, utiliser le pays du club
        countriesSet.add(clubCountryMap.get(clubName)!);
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