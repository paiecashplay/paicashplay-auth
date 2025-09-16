import { NextRequest, NextResponse } from 'next/server';
import { requireOAuthScope } from '@/lib/oauth-middleware';
import { prisma } from '@/lib/prisma';

// GET /api/oauth/clubs/[clubId]/members - Lister les membres d'un club
export const GET = requireOAuthScope(['clubs:members'])(async (
  request: NextRequest, 
  context,
  routeParams
) => {
  const { params } = routeParams || { params: {} };
  if (!params?.clubId) {
    return NextResponse.json({ error: 'Club ID required' }, { status: 400 });
  }
  
  const { searchParams } = new URL(request.url);
  const position = searchParams.get('position');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

  try {
    // Verify club exists
    const club = await prisma.user.findFirst({
      where: { 
        id: params.clubId,
        userType: 'club'
      },
      include: { profile: true }
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Find players associated with this club using MySQL JSON syntax
    let members = await prisma.user.findMany({
      where: {
        userType: 'player',
        profile: {
          metadata: {
            path: '$.clubId',
            equals: params.clubId
          }
        }
      },
      include: { profile: true }
    });

    // Apply additional filters with Prisma
    if (position || status) {
      const additionalFilters: any = {
        userType: 'player',
        profile: {
          metadata: {
            path: '$.clubId',
            equals: params.clubId
          }
        }
      };
      
      if (position) {
        additionalFilters.AND = additionalFilters.AND || [];
        additionalFilters.AND.push({
          profile: {
            metadata: {
              path: '$.position',
              equals: position
            }
          }
        });
      }
      
      if (status) {
        additionalFilters.AND = additionalFilters.AND || [];
        additionalFilters.AND.push({
          profile: {
            metadata: {
              path: '$.status',
              equals: status
            }
          }
        });
      }
      
      members = await prisma.user.findMany({
        where: additionalFilters,
        include: { profile: true }
      });
    }

    // Get total count
    const total = await prisma.user.count({
      where: {
        userType: 'player',
        profile: {
          metadata: {
            path: '$.clubId',
            equals: params.clubId
          }
        }
      }
    });
    
    // Apply pagination with Prisma
    const paginatedMembers = await prisma.user.findMany({
      where: {
        userType: 'player',
        profile: {
          metadata: {
            path: '$.clubId',
            equals: params.clubId
          }
        }
      },
      include: { profile: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      club: {
        id: club.id,
        name: club.profile?.firstName && club.profile?.lastName 
          ? `${club.profile.firstName} ${club.profile.lastName}`.trim()
          : club.profile?.firstName || club.email
      },
      members: paginatedMembers.map(member => ({
        id: member.id,
        email: member.email,
        firstName: member.profile?.firstName,
        lastName: member.profile?.lastName,
        country: member.profile?.country,
        phone: member.profile?.phone,
        height: member.profile?.height,
        weight: member.profile?.weight,
        isVerified: member.isVerified,
        createdAt: member.createdAt,
        metadata: member.profile?.metadata
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get members error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// POST /api/oauth/clubs/[clubId]/members - Ajouter un membre au club
export const POST = requireOAuthScope(['clubs:write', 'users:write'])(async (
  request: NextRequest,
  context,
  routeParams
) => {
  const { params } = routeParams || { params: {} };
  if (!params?.clubId) {
    return NextResponse.json({ error: 'Club ID required' }, { status: 400 });
  }
  
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, country, phone, height, weight, metadata = {} } = body;

    if (!firstName || !lastName) {
      return NextResponse.json({ 
        error: 'Missing required fields: firstName, lastName' 
      }, { status: 400 });
    }

    // Si email fourni, vérifier qu'il n'existe pas déjà
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return NextResponse.json({ 
          error: 'User with this email already exists' 
        }, { status: 409 });
      }
    }

    // Verify club exists
    const club = await prisma.user.findFirst({
      where: { 
        id: params.clubId,
        userType: 'club'
      },
      include: { profile: true }
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Générer un email temporaire si non fourni
    const playerEmail = email ? email.toLowerCase() : `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@player.paiecashplay.com`;
    
    // Hash password si fourni, sinon générer un mot de passe temporaire
    const bcrypt = require('bcryptjs');
    const playerPassword = password || Math.random().toString(36).substr(2, 12);
    const passwordHash = await bcrypt.hash(playerPassword, 12);

    // Create player with club association
    const player = await prisma.user.create({
      data: {
        email: playerEmail,
        passwordHash,
        userType: 'player',
        isVerified: email ? false : true, // Vérifié automatiquement si pas d'email réel
        profile: {
          create: {
            firstName,
            lastName,
            country,
            phone,
            height: height ? parseFloat(height) : null,
            weight: weight ? parseFloat(weight) : null,
            metadata: {
              ...metadata,
              clubId: params.clubId,
              clubName: (club.profile?.metadata as any)?.organizationName ? (club.profile?.metadata as any)?.organizationName :  club.email,
              joinDate: new Date().toISOString(),
              status: metadata.status || 'active',
              hasRealEmail: !!email, // Indiquer si c'est un vrai email
              isMinor: !email // Considérer comme mineur si pas d'email
            }
          }
        }
      },
      include: {
        profile: true
      }
    });

    return NextResponse.json({
      member: {
        id: player.id,
        email: player.email,
        firstName: player.profile?.firstName,
        lastName: player.profile?.lastName,
        country: player.profile?.country,
        phone: player.profile?.phone,
        height: player.profile?.height,
        weight: player.profile?.weight,
        isVerified: player.isVerified,
        createdAt: player.createdAt,
        metadata: player.profile?.metadata
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Add member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});