import { NextRequest, NextResponse } from 'next/server';
import { requireOAuthScope } from '@/lib/oauth-middleware';
import { prisma } from '@/lib/prisma';

// GET /api/oauth/clubs/[clubId]/members - Lister les membres d'un club
export const GET = requireOAuthScope(['clubs:members'])(async (
  request: NextRequest, 
  context,
  { params }: { params: { clubId: string } }
) => {
  const { searchParams } = new URL(request.url);
  const position = searchParams.get('position');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

  // Verify club exists
  const club = await prisma.user.findFirst({
    where: { 
      id: params.clubId,
      userType: 'club'
    }
  });

  if (!club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  }

  // Find players associated with this club
  const whereClause: any = {
    userType: 'player',
    profile: {
      metadata: {
        path: ['clubId'],
        equals: params.clubId
      }
    }
  };
  
  // Ajouter les filtres additionnels
  if (position || status) {
    const additionalFilters: any = {};
    if (position) additionalFilters.position = position;
    if (status) additionalFilters.status = status;
    
    whereClause.profile.metadata = {
      ...whereClause.profile.metadata,
      ...Object.entries(additionalFilters).reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as any)
    };
  }
  
  const members = await prisma.user.findMany({
    where: whereClause,
    include: {
      profile: true
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  const total = await prisma.user.count({
    where: {
      userType: 'player',
      profile: {
        metadata: {
          path: ['clubId'],
          equals: params.clubId
        }
      }
    }
  });

  return NextResponse.json({
    club: {
      id: club.id,
      name: club.profile?.firstName || club.email
    },
    members: members.map(member => ({
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
});

// POST /api/oauth/clubs/[clubId]/members - Ajouter un membre au club
export const POST = requireOAuthScope(['clubs:write', 'users:write'])(async (
  request: NextRequest,
  context,
  { params }: { params: { clubId: string } }
) => {
  const body = await request.json();
  const { email, password, firstName, lastName, country, phone, metadata = {} } = body;

  if (!email || !password || !firstName || !lastName) {
    return NextResponse.json({ 
      error: 'Missing required fields: email, password, firstName, lastName' 
    }, { status: 400 });
  }

  // Verify club exists and user has permission
  const club = await prisma.user.findFirst({
    where: { 
      id: params.clubId,
      userType: 'club'
    }
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
            clubName: club.profile?.firstName || club.email
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
});

// PUT /api/oauth/clubs/[clubId]/members/[memberId] - Modifier un membre
export const PUT = requireOAuthScope(['clubs:write', 'users:write'])(async (
  request: NextRequest,
  context,
  { params }: { params: { clubId: string; memberId: string } }
) => {
  const body = await request.json();
  const { firstName, lastName, country, phone, metadata = {} } = body;

  // Vérifier que le club existe
  const club = await prisma.user.findFirst({
    where: { 
      id: params.clubId,
      userType: 'club'
    }
  });

  if (!club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  }

  // Vérifier que le membre existe et appartient au club
  const member = await prisma.user.findFirst({
    where: {
      id: params.memberId,
      userType: 'player',
      profile: {
        metadata: {
          path: ['clubId'],
          equals: params.clubId
        }
      }
    },
    include: { profile: true }
  });

  if (!member) {
    return NextResponse.json({ error: 'Member not found in this club' }, { status: 404 });
  }

  // Mettre à jour le profil
  const updatedProfile = await prisma.userProfile.update({
    where: { userId: params.memberId },
    data: {
      firstName: firstName || member.profile?.firstName,
      lastName: lastName || member.profile?.lastName,
      country: country || member.profile?.country,
      phone: phone || member.profile?.phone,
      metadata: {
        ...member.profile?.metadata,
        ...metadata,
        clubId: params.clubId, // Maintenir l'association au club
        clubName: club.profile?.firstName || club.email
      }
    }
  });

  return NextResponse.json({
    member: {
      id: member.id,
      email: member.email,
      firstName: updatedProfile.firstName,
      lastName: updatedProfile.lastName,
      country: updatedProfile.country,
      phone: updatedProfile.phone,
      isVerified: member.isVerified,
      metadata: updatedProfile.metadata
    }
  });
});

// DELETE /api/oauth/clubs/[clubId]/members/[memberId] - Retirer un membre
export const DELETE = requireOAuthScope(['clubs:write'])(async (
  request: NextRequest,
  context,
  { params }: { params: { clubId: string; memberId: string } }
) => {
  // Vérifier que le membre existe et appartient au club
  const member = await prisma.user.findFirst({
    where: {
      id: params.memberId,
      userType: 'player',
      profile: {
        metadata: {
          path: ['clubId'],
          equals: params.clubId
        }
      }
    },
    include: { profile: true }
  });

  if (!member) {
    return NextResponse.json({ error: 'Member not found in this club' }, { status: 404 });
  }

  // Retirer l'association au club (ne pas supprimer l'utilisateur)
  await prisma.userProfile.update({
    where: { userId: params.memberId },
    data: {
      metadata: {
        ...member.profile?.metadata,
        clubId: null,
        clubName: null,
        status: 'free_agent'
      }
    }
  });

  return NextResponse.json({ success: true });
});