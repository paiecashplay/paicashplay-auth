import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateOAuthToken } from '@/lib/oauth-middleware';

export async function GET(request: NextRequest) {
  try {
    const validation = await validateOAuthToken(request, ['profile', 'ambassadors:read']);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search');
    const country = searchParams.get('country');
    const isActive = searchParams.get('active');

    const skip = (page - 1) * limit;

    const where: any = {
      userType: 'affiliate',
      isActive: isActive ? isActive === 'true' : undefined
    };

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { profile: { firstName: { contains: search } } },
        { profile: { lastName: { contains: search } } }
      ];
    }

    if (country) {
      where.profile = { country };
    }

    const [ambassadors, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
              country: true,
              avatarUrl: true,
              isPartner: true,
              metadata: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      ambassadors: ambassadors.map(ambassador => ({
        id: ambassador.id,
        email: ambassador.email,
        firstName: ambassador.profile?.firstName,
        lastName: ambassador.profile?.lastName,
        phone: ambassador.profile?.phone,
        country: ambassador.profile?.country,
        avatarUrl: ambassador.profile?.avatarUrl,
        isPartner: ambassador.profile?.isPartner,
        isVerified: ambassador.isVerified,
        isActive: ambassador.isActive,
        metadata: ambassador.profile?.metadata,
        createdAt: ambassador.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Ambassadors API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}