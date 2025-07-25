import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export const GET = requireAdmin(async (request: NextRequest, admin: any, { params }: { params: { id: string } }) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
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
        },
        sessions: {
          where: {
            expiresAt: {
              gt: new Date()
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified,
        isActive: user.isActive,
        loginAttempts: user.loginAttempts,
        lockedUntil: user.lockedUntil,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profile: user.profile,
        socialAccounts: user.socialAccounts.map(account => ({
          provider: account.provider.displayName,
          type: account.provider.type,
          email: account.email,
          name: account.name,
          avatar: account.avatar,
          createdAt: account.createdAt
        })),
        activeSessions: user.sessions.length
      }
    });
  } catch (error) {
    console.error('Admin user fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const PUT = requireAdmin(async (request: NextRequest, admin: any, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json();
    const { isActive, isVerified, profile } = body;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        isActive,
        isVerified
      }
    });

    // Update profile if provided
    if (profile) {
      await prisma.userProfile.update({
        where: { userId: params.id },
        data: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone || null,
          country: profile.country || null,
          metadata: profile.metadata || null
        }
      });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = requireAdmin(async (request: NextRequest, admin: any, { params }: { params: { id: string } }) => {
  try {
    await prisma.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Admin user delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});