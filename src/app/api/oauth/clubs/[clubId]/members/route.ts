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
        name: club.profile?.firstName || club.email
      },
      members: paginatedMembers.map(member => ({
        id: member.id,
        email: member.email,
        firstName: member.profile?.firstName,
        lastName: member.profile?.lastName,
        country: member.profile?.country,
        phone: member.profile?.phone,
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
    const { email, password, firstName, lastName, country, phone, metadata = {} } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ 
        error: 'Missing required fields: email, password, firstName, lastName' 
      }, { status: 400 });
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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 409 });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 12);

    // Create player with club association
    const player = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        userType: 'player',
        isVerified: true,
        profile: {
          create: {
            firstName,
            lastName,
            country,
            phone,
            metadata: {
              ...metadata,
              clubId: params.clubId,
              clubName: club.profile?.firstName || club.email,
              joinDate: new Date().toISOString(),
              status: metadata.status || 'active'
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