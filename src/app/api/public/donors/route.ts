import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// OPTIONS /api/public/donors - CORS preflight
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

// GET /api/public/donors - Liste publique des donateurs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Chercher tous les utilisateurs qui sont donateurs :
    // 1. Type principal 'donor'
    // 2. Ou qui ont isDonor: true dans leurs métadonnées
    const where: any = {
      OR: [
        { userType: 'donor' },
        {
          profile: {
            metadata: {
              path: ['isDonor'],
              equals: true
            }
          }
        }
      ]
    };

    if (country) {
      where.AND = where.AND || [];
      where.AND.push({
        profile: { country }
      });
    }

    const donors = await prisma.user.findMany({
      where,
      include: { profile: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where });

    const response = NextResponse.json({
      donors: donors.map(donor => ({
        id: donor.id,
        firstName: donor.profile?.firstName,
        lastName: donor.profile?.lastName,
        country: donor.profile?.country,
        isVerified: donor.isVerified,
        createdAt: donor.createdAt,
        primaryType: donor.userType,
        isDonor: donor.userType === 'donor' || (donor.profile?.metadata as any)?.isDonor === true,
        totalDonations: (donor.profile?.metadata as any)?.totalDonated || 0,
        supportedCauses: (donor.profile?.metadata as any)?.preferredCauses || [],
        ...(donor.userType === 'club' && {
          clubInfo: {
            league: (donor.profile?.metadata as any)?.league,
            stadium: (donor.profile?.metadata as any)?.stadium
          }
        }),
        ...(donor.userType === 'player' && {
          playerInfo: {
            position: (donor.profile?.metadata as any)?.position,
            club: (donor.profile?.metadata as any)?.clubName
          }
        })
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;

  } catch (error) {
    console.error('Public donors error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}