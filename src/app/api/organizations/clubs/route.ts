import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const clubs = await prisma.user.findMany({
      where: {
        userType: 'club',
        isActive: true,
        isVerified: true
      },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            metadata: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const formattedClubs = clubs.map(club => {
      const metadata = club.profile?.metadata as any;
      return {
        id: club.id,
        name: metadata?.organizationName || `${club.profile?.firstName} ${club.profile?.lastName}`,
        country: metadata?.country || 'FR'
      };
    });

    return NextResponse.json({ clubs: formattedClubs });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json({ error: 'Failed to fetch clubs' }, { status: 500 });
  }
}