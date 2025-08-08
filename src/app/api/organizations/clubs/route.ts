import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const clubs = await prisma.user.findMany({
      where: { 
        userType: 'club',
        isActive: true 
      },
      include: {
        profile: {
          select: {
            metadata: true
          }
        }
      }
    });

    const clubList = clubs
      .filter(club => club.profile?.metadata && typeof club.profile.metadata === 'object' && 'organizationName' in club.profile.metadata)
      .map(club => ({
        id: club.id,
        name: (club.profile?.metadata as any)?.organizationName
      }))
      .filter(club => club.name);

    return NextResponse.json({ clubs: clubList });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json({ clubs: [] });
  }
}