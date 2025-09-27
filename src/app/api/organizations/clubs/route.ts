import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';

export async function GET() {
  try {
    const clubs = await prisma.user.findMany({
      where: {
        userType: 'club',
        isActive: true
      },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            country: true,
            metadata: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const formattedClubs = clubs.map(club => {
      const metadata = club.profile?.metadata as any;
      return {
        id: club.id,
        name: metadata?.organizationName || `${club.profile?.firstName} ${club.profile?.lastName}`,
        country: club.profile?.country || 'FR'
      };
    });

    return NextResponse.json({ clubs: formattedClubs });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json({ error: 'Failed to fetch clubs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clubName, country, federationName } = await request.json();

    if (!clubName || !country) {
      return NextResponse.json({ error: 'Club name and country are required' }, { status: 400 });
    }

    // Vérifier si le club existe déjà
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
    
    const existingClub = allClubs.find(club => {
      const metadata = club.profile?.metadata as any;
      const existingClubName = metadata?.organizationName;
      return existingClubName === clubName && club.profile?.country === country;
    });

    if (existingClub) {
      return NextResponse.json({ 
        club: {
          id: existingClub.id,
          name: clubName,
          country: country,
          isExisting: true
        }
      });
    }

    // Créer un nouveau club automatiquement
    const clubEmail = `${clubName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${country.toLowerCase().replace(/[^a-z0-9]/g, '')}@paiecashplay.com`;
    const defaultPassword = await hashPassword('defaultclub123'); // Mot de passe par défaut

    const newClub = await prisma.user.create({
      data: {
        email: clubEmail,
        passwordHash: defaultPassword,
        userType: 'club',
        isVerified: false, // Le club devra vérifier son email plus tard
        profile: {
          create: {
            firstName: 'Club',
            lastName: 'Administrateur',
            country: country,
            metadata: {
              organizationName: clubName,
              federation: federationName || null,
              isAutoCreated: true,
              createdByPlayer: true
            }
          }
        }
      }
    });

    console.log(`✅ Auto-created club: ${clubName} in ${country}`);

    return NextResponse.json({ 
      club: {
        id: newClub.id,
        name: clubName,
        country: country,
        isExisting: false,
        isAutoCreated: true
      }
    });
  } catch (error) {
    console.error('Error creating club:', error);
    return NextResponse.json({ error: 'Failed to create club' }, { status: 500 });
  }
}