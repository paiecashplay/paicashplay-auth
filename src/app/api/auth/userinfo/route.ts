import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const accessToken = authHeader.substring(7);
    const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
    
    // Verify OAuth access token
    const tokenRecord = await prisma.accessToken.findFirst({
      where: {
        tokenHash: tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
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
        }
      }
    });

    if (!tokenRecord) {
      return NextResponse.json({ error: 'Invalid or expired access token' }, { status: 401 });
    }

    const user = tokenRecord.user;

    // Determine picture URL - prioritize uploaded photo over social avatar
    let pictureUrl = user.profile?.avatarUrl;
    
    // If no uploaded photo, use social account avatar as fallback
    if (!pictureUrl || !pictureUrl.includes('storage.googleapis.com')) {
      const socialAvatar = user.socialAccounts.find(account => account.avatar)?.avatar;
      if (socialAvatar && !pictureUrl) {
        pictureUrl = socialAvatar;
      }
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
      picture: pictureUrl,
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
  } catch (error: any) {
    console.error('UserInfo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}