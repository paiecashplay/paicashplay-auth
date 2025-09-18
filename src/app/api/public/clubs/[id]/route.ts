import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FederationService } from '@/lib/federations';

// OPTIONS /api/public/clubs/[id] - CORS preflight
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

// GET /api/public/clubs/[id] - Détails complets d'un club
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Récupérer le club
    const club = await prisma.user.findFirst({
      where: {
        id,
        userType: 'club',
        isActive: true,
        isVerified: true
      },
      include: { profile: true }
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const metadata = club.profile?.metadata as any;

    // Récupérer les joueurs du club
    const players = await prisma.user.findMany({
      where: {
        userType: 'player',
        isActive: true,
        isVerified: true
      },
      include: { profile: true }
    });

    const clubPlayers = players.filter(player => {
      const playerMetadata = player.profile?.metadata as any;
      return playerMetadata?.club === metadata?.organizationName;
    });

    const response = NextResponse.json({
      // Informations de base
      id: club.id,
      name: metadata?.organizationName,
      email: club.email,
      phone: club.profile?.phone,
      country: club.profile?.country,
      language: club.profile?.language,
      avatarUrl: club.profile?.avatarUrl,
      isVerified: club.isVerified,
      isActive: club.isActive,
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
      
      // Métadonnées complètes du club
      federation: (() => {
        const clubCountry = club.profile?.country;
        const federation = FederationService.getFederationByCountry(clubCountry || '');
        return federation?.name || metadata?.federation;
      })(),
      website: metadata?.website,
      address: metadata?.address,
      foundedYear: metadata?.foundedYear,
      description: metadata?.description,
      clubType: metadata?.clubType,
      
      // Installations et équipements
      facilities: metadata?.facilities || [],
      
      // Réalisations et palmarès
      achievements: metadata?.achievements || [],
      
      // Informations de contact étendues
      socialMedia: metadata?.socialMedia,
      
      // Statistiques du club
      statistics: {
        totalPlayers: clubPlayers.length,
        playersByPosition: {
          goalkeeper: clubPlayers.filter(p => (p.profile?.metadata as any)?.position === 'goalkeeper').length,
          defender: clubPlayers.filter(p => (p.profile?.metadata as any)?.position === 'defender').length,
          midfielder: clubPlayers.filter(p => (p.profile?.metadata as any)?.position === 'midfielder').length,
          forward: clubPlayers.filter(p => (p.profile?.metadata as any)?.position === 'forward').length
        },
        averageAge: clubPlayers.length > 0 ? 
          clubPlayers.reduce((sum, p) => {
            const birthDate = (p.profile?.metadata as any)?.dateOfBirth;
            if (birthDate) {
              const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
              return sum + age;
            }
            return sum;
          }, 0) / clubPlayers.length : 0,
        verifiedPlayers: clubPlayers.filter(p => p.isVerified).length
      },
      
      // Staff et encadrement
      staff: metadata?.staff || [],
      
      // Informations financières publiques
      budget: metadata?.publicBudget,
      sponsors: metadata?.sponsors || [],
      
      // Métadonnées complètes
      metadata: metadata
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;

  } catch (error) {
    console.error('Public club detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}