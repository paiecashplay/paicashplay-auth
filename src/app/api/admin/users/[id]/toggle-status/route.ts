import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification admin
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin-token')?.value;
    
    if (!adminToken) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    let adminId: string;
    try {
      const decoded = jwt.verify(adminToken, process.env.JWT_SECRET!) as any;
      adminId = decoded.adminId;
    } catch (error) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Récupérer l'utilisateur actuel
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, isActive: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Inverser le statut
    const newStatus = !user.isActive;
    
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: newStatus }
    });

    // Log de l'action admin
    await prisma.auditLog.create({
      data: {
        adminId,
        action: newStatus ? 'ACTIVATE_USER' : 'SUSPEND_USER',
        resourceType: 'User',
        resourceId: params.id,
        oldValues: { isActive: user.isActive },
        newValues: { isActive: newStatus },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: updatedUser,
      message: `Utilisateur ${newStatus ? 'activé' : 'suspendu'} avec succès`
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}