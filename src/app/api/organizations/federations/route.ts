import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const federations = await prisma.user.findMany({
      where: { 
        userType: 'federation',
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

    const federationList = federations
      .filter(federation => federation.profile?.metadata && typeof federation.profile.metadata === 'object' && 'organizationName' in federation.profile.metadata)
      .map(federation => ({
        id: federation.id,
        name: (federation.profile?.metadata as any)?.organizationName
      }))
      .filter(federation => federation.name);

    return NextResponse.json({ federations: federationList });
  } catch (error) {
    console.error('Error fetching federations:', error);
    return NextResponse.json({ federations: [] });
  }
}