import { NextRequest, NextResponse } from 'next/server';
import { ServiceAdminService } from '@/lib/service-admin';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Token requis' }, { status: 400 });
    }

    const validation = await ServiceAdminService.validateServiceToken(token);
    
    if (!validation) {
      return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 401 });
    }

    // Get admin info
    const admin = await prisma.adminUser.findUnique({
      where: { id: validation.adminId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        services: true,
        isActive: true
      }
    });

    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: 'Administrateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role
      },
      serviceKey: validation.serviceKey
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}