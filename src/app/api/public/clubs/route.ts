import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCountryVariants } from '@/lib/utils';

// OPTIONS /api/public/clubs - CORS preflight
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

// GET /api/public/clubs - Liste publique des clubs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const federation = searchParams.get('federation');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const where: any = { 
      userType: 'club',
      isActive: true,
      isVerified: true
    };

    // Filtrer par pays si spécifié
    if (country) {
      const countryVariants = getCountryVariants(country);
      where.profile = {
        country: {
          in: countryVariants
        }
      };
    }

    // Récupérer tous les clubs
    const allClubs = await prisma.user.findMany({
      where,
      include: { profile: true },
      orderBy: { createdAt: 'desc' }
    });

    // Filtrer par fédération si spécifié
    let filteredClubs = allClubs;
    if (federation) {
      filteredClubs = allClubs.filter(club => {
        const metadata = club.profile?.metadata as any;
        return metadata?.federation?.toLowerCase().includes(federation.toLowerCase());
      });
    }

    const total = filteredClubs.length;
    const clubs = filteredClubs.slice((page - 1) * limit, page * limit);

    const response = NextResponse.json({
      clubs: clubs.map(club => {
        const metadata = club.profile?.metadata as any;
        return {
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
          
          // Métadonnées du club
          federation: metadata?.federation,
          website: metadata?.website,
          address: metadata?.address,
          foundedYear: metadata?.foundedYear,
          description: metadata?.description,
          clubType: metadata?.clubType,
          facilities: metadata?.facilities || [],
          achievements: metadata?.achievements || [],
          
          // Statistiques
          playerCount: metadata?.playerCount || 0,
          coachCount: metadata?.coachCount || 0,
          
          // Contact
          socialMedia: metadata?.socialMedia,
          
          // Métadonnées complètes pour OAuth
          metadata: metadata
        };
      }),
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
    console.error('Public clubs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}