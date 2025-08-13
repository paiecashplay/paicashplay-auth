import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateOAuthToken } from '@/lib/oauth-middleware';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const validation = await validateOAuthToken(request, ['profile', 'ambassadors:read']);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { id } = await params;

    const ambassador = await prisma.user.findFirst({
      where: {
        id,
        userType: 'affiliate'
      },
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
      }
    });

    if (!ambassador) {
      return NextResponse.json({ error: 'Ambassador not found' }, { status: 404 });
    }

    return NextResponse.json({
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
    });

  } catch (error) {
    console.error('Ambassador API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}