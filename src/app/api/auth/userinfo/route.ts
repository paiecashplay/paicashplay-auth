import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const payload = await verifyJWT(token);
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return OpenID Connect standard claims
    const userInfo = {
      sub: user.id,
      email: user.email,
      email_verified: user.isVerified,
      name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}`.trim() : null,
      given_name: user.profile?.firstName,
      family_name: user.profile?.lastName,
      phone_number: user.profile?.phone,
      locale: user.profile?.language || 'fr',
      picture: user.profile?.avatarUrl,
      updated_at: Math.floor(new Date(user.updatedAt).getTime() / 1000),
      
      // Custom PaieCashPlay claims
      user_type: user.userType,
      is_active: user.isActive,
      created_at: Math.floor(new Date(user.createdAt).getTime() / 1000),
      
      // Type-specific metadata
      ...(user.profile?.metadata && { metadata: user.profile.metadata }),
      
      // Social accounts
      social_accounts: user.socialAccounts.map(account => ({
        provider: account.provider.name,
        provider_type: account.provider.type,
        linked_at: Math.floor(new Date(account.createdAt).getTime() / 1000)
      }))
    };

    // Remove null/undefined values
    Object.keys(userInfo).forEach(key => {
      if (userInfo[key as keyof typeof userInfo] === null || userInfo[key as keyof typeof userInfo] === undefined) {
        delete userInfo[key as keyof typeof userInfo];
      }
    });

    return NextResponse.json(userInfo);
  } catch (error) {
    console.error('UserInfo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}