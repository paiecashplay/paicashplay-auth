import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FederationService } from '@/lib/federations';

// OPTIONS /api/public/players/[id] - CORS preflight
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

// GET /api/public/players/[id] - Détails complets d'un joueur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Récupérer le joueur
    const player = await prisma.user.findFirst({
      where: {
        id,
        userType: 'player',
        isActive: true,
        isVerified: true
      },
      include: { profile: true }
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const metadata = player.profile?.metadata as any;
    
    // Récupérer les informations du club si disponible
    let clubInfo = null;
    const clubName = metadata?.club;
    if (clubName && clubName !== 'Club non renseigné') {
      const club = await prisma.user.findFirst({
        where: {
          userType: 'club'
        },
        include: { profile: true }
      });

      if (club && (club.profile?.metadata as any)?.organizationName === clubName) {
        const clubMetadata = club.profile?.metadata as any;
        const clubCountry = club.profile?.country;
        const federation = FederationService.getFederationByCountry(clubCountry || '');
        
        clubInfo = {
          id: club.id,
          name: clubMetadata?.organizationName,
          country: clubCountry,
          federation: federation?.name || clubMetadata?.federation,
          email: club.email,
          phone: club.profile?.phone,
          website: clubMetadata?.website,
          address: clubMetadata?.address,
          foundedYear: clubMetadata?.foundedYear,
          description: clubMetadata?.description,
          isVerified: club.isVerified,
          createdAt: club.createdAt,
          updatedAt: club.updatedAt
        };
      } else {
        // Pour les clubs non référencés, utiliser le pays du joueur
        const playerCountry = player.profile?.country;
        const federation = FederationService.getFederationByCountry(playerCountry || '');
        
        clubInfo = {
          id: null,
          name: clubName,
          country: playerCountry,
          federation: federation?.name || null,
          email: null,
          phone: null,
          website: null,
          address: null,
          foundedYear: null,
          description: null,
          isVerified: false,
          createdAt: null,
          updatedAt: null
        };
      }
    }

    // Calculer l'âge
    const calculateAge = (birthDate: string) => {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    const response = NextResponse.json({
      // Informations de base
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
      
      // Métadonnées complètes du joueur
      position: metadata?.position,
      dateOfBirth: metadata?.dateOfBirth,
      age: metadata?.dateOfBirth ? calculateAge(metadata.dateOfBirth) : null,
      status: metadata?.status || 'active',
      preferredFoot: metadata?.preferredFoot,
      jerseyNumber: metadata?.jerseyNumber,
      nationality: metadata?.nationality,
      placeOfBirth: metadata?.placeOfBirth,
      
      // Informations sportives détaillées
      experience: metadata?.experience,
      previousClubs: metadata?.previousClubs || [],
      achievements: metadata?.achievements || [],
      injuries: metadata?.injuries || [],
      medicalInfo: metadata?.medicalInfo,
      
      // Informations de contact d'urgence
      emergencyContact: metadata?.emergencyContact,
      
      // Informations académiques/scolaires
      education: metadata?.education,
      
      // Préférences et notes
      notes: metadata?.notes,
      preferences: metadata?.preferences,
      
      // Informations du club
      club: (clubInfo && clubName !== 'Club non renseigné') ? clubInfo : {
        id: 'default',
        name: 'PaieCashPlay Club',
        country: null,
        federation: 'PaieCashPlay Foundation',
        email: 'club@paiecashplay.com',
        phone: null,
        website: 'https://paiecashplay.com',
        address: null,
        foundedYear: 2024,
        description: 'Club par défaut pour tous les joueurs PaieCashPlay',
        isVerified: true,
        createdAt: null,
        updatedAt: null
      },
      
      // Statistiques (si disponibles)
      statistics: metadata?.statistics,
      
      // Informations contractuelles (masquées pour la sécurité)
      contractStatus: metadata?.contractStatus ? 'active' : 'inactive'
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;

  } catch (error) {
    console.error('Public player detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}