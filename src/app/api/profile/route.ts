import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const userWithProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        socialAccounts: {
          include: {
            provider: {
              select: {
                name: true,
                displayName: true,
                type: true
              }
            }
          }
        }
      }
    });

    if (!userWithProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: userWithProfile.id,
        email: userWithProfile.email,
        userType: userWithProfile.userType,
        isVerified: userWithProfile.isVerified,
        createdAt: userWithProfile.createdAt,
        profile: userWithProfile.profile,
        avatarUrl: userWithProfile.profile?.avatarUrl,
        socialAccounts: userWithProfile.socialAccounts.map(account => ({
          provider: account.provider.displayName,
          type: account.provider.type,
          email: account.email,
          name: account.name,
          avatar: account.avatar
        }))
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const PUT = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { firstName, lastName, phone, country, metadata } = body;

    const updatedProfile = await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        firstName,
        lastName,
        phone: phone || null,
        country: country || null,
        metadata: metadata || null
      }
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});