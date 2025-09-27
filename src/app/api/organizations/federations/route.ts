import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mapping des pays vers les noms de fédérations
const FEDERATION_NAMES: { [key: string]: string } = {
  'France': 'Fédération Française de Football',
  'Cameroun': 'Fédération Camerounaise de Football',
  'Royaume-Uni': 'Fédération Anglaise de Football',
  'Espagne': 'Fédération Espagnole de Football',
  'Allemagne': 'Fédération Allemande de Football',
  'Italie': 'Fédération Italienne de Football',
  'Brésil': 'Fédération Brésilienne de Football',
  'Argentine': 'Fédération Argentine de Football',
  'Portugal': 'Fédération Portugaise de Football',
  'Pays-Bas': 'Fédération Néerlandaise de Football',
  'Belgique': 'Fédération Belge de Football',
  'Maroc': 'Fédération Royale Marocaine de Football',
  'Algérie': 'Fédération Algérienne de Football',
  'Tunisie': 'Fédération Tunisienne de Football',
  'Sénégal': 'Fédération Sénégalaise de Football',
  'Côte d\'Ivoire': 'Fédération Ivoirienne de Football',
  'Ghana': 'Fédération Ghanéenne de Football',
  'Nigeria': 'Fédération Nigériane de Football'
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    // Si aucun pays n'est spécifié, retourner toutes les fédérations
    if (!country) {
      const allFederations = await prisma.user.findMany({
        where: {
          userType: 'federation',
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

      const formattedFederations = allFederations.map(federation => {
        const metadata = federation.profile?.metadata as any;
        return {
          id: federation.id,
          name: metadata?.organizationName || `${federation.profile?.firstName} ${federation.profile?.lastName}`,
          country: federation.profile?.country || 'FR',
          isDefault: metadata?.isDefault || false
        };
      });

      return NextResponse.json({ federations: formattedFederations });
    }

    // Chercher une fédération existante pour ce pays
    let federation = await prisma.user.findFirst({
      where: {
        userType: 'federation',
        isActive: true,
        profile: {
          country: country
        }
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
      }
    });

    // Si aucune fédération n'existe, créer une fédération par défaut
    if (!federation) {
      const federationName = FEDERATION_NAMES[country] || `Fédération ${country} de Football`;
      
      // Créer la fédération par défaut
      federation = await prisma.user.create({
        data: {
          email: `federation.${country.toLowerCase().replace(/[^a-z0-9]/g, '')}@paiecashplay.com`,
          passwordHash: '$2b$12$defaulthashforfederations', // Hash par défaut
          userType: 'federation',
          isVerified: true, // Les fédérations par défaut sont pré-vérifiées
          profile: {
            create: {
              firstName: 'Fédération',
              lastName: 'Officielle',
              country: country,
              metadata: {
                organizationName: federationName,
                position: 'Président',
                isDefault: true
              }
            }
          }
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
        }
      });

      console.log(`✅ Created default federation for ${country}: ${federationName}`);
    }

    const metadata = federation.profile?.metadata as any;
    const federationData = {
      id: federation.id,
      name: metadata?.organizationName || `${federation.profile?.firstName} ${federation.profile?.lastName}`,
      country: federation.profile?.country || country,
      isDefault: metadata?.isDefault || false
    };

    return NextResponse.json({ federation: federationData });
  } catch (error) {
    console.error('Error fetching/creating federation:', error);
    return NextResponse.json({ error: 'Failed to fetch federation' }, { status: 500 });
  }
}