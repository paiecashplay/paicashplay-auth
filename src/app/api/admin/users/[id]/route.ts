import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  
  return requireAdmin(async (req: NextRequest, admin: any) => {
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
  })(request);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  
  return requireAdmin(async (req: NextRequest, admin: any) => {
    try {
      const body = await req.json();
      const { isActive, isVerified, profile } = body;

      const updatedUser = await prisma.user.update({
        where: { id: params.id },
        data: {
          isActive,
          isVerified
        }
      });

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
  })(request);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  
  return requireAdmin(async (req: NextRequest, admin: any) => {
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
  })(request);
}