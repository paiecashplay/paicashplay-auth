import { NextRequest, NextResponse } from 'next/server';
import { requireOAuthScope } from '@/lib/oauth-middleware';
import { prisma } from '@/lib/prisma';

// GET /api/oauth/users - Lister les utilisateurs
export const GET = requireOAuthScope(['users:read'])(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url);
  const userType = searchParams.get('user_type');
  const country = searchParams.get('country');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

  const where: any = {};
  if (userType) where.userType = userType;
  if (country) where.profile = { country };

  const users = await prisma.user.findMany({
    where,
    include: {
      profile: true
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  const total = await prisma.user.count({ where });

  return NextResponse.json({
    users: users.map(user => ({
      id: user.id,
      email: user.email,
      userType: user.userType,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      profile: user.profile ? {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        country: user.profile.country,
        phone: user.profile.phone,
        metadata: user.profile.metadata
      } : null
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// POST /api/oauth/users - Créer un utilisateur
export const POST = requireOAuthScope(['users:write'])(async (request: NextRequest, context) => {
  const body = await request.json();
  const { email, password, userType, firstName, lastName, country, phone, metadata } = body;

  if (!email || !password || !userType) {
    return NextResponse.json({ 
      error: 'Missing required fields: email, password, userType' 
    }, { status: 400 });
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

  // Create user and profile
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      userType,
      isVerified: true, // OAuth created users are auto-verified
      profile: {
        create: {
          firstName,
          lastName,
          country,
          phone,
          metadata: metadata || {}
        }
      }
    },
    include: {
      profile: true
    }
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      userType: user.userType,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      profile: user.profile
    }
  }, { status: 201 });
});