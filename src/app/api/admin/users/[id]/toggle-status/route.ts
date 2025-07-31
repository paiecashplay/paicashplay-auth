import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { AdminAuthService } from '@/lib/admin-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Vérifier l'authentification admin
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const admin = await AdminAuthService.validateAdminSession(sessionToken);
    if (!admin) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

    // Récupérer l'utilisateur actuel
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, isActive: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Inverser le statut
    const newStatus = !user.isActive;
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: newStatus }
    });

    // Log de l'action admin
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: newStatus ? 'ACTIVATE_USER' : 'SUSPEND_USER',
        resourceType: 'User',
        resourceId: id,
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