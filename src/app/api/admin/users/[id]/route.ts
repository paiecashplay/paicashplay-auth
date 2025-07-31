import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { AdminAuthService } from '@/lib/admin-auth';

// GET - Récupérer un utilisateur spécifique
export async function GET(
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

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        sessions: {
          where: { expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            sessions: true,
            emailVerifications: true,
            passwordResets: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Mettre à jour un utilisateur
export async function PUT(
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

    const body = await request.json();
    const { 
      email, 
      isVerified, 
      isActive, 
      userType,
      firstName,
      lastName,
      phone,
      country
    } = body;

    // Construire les données de mise à jour
    const updateData: any = {};
    if (email !== undefined) updateData.email = email;
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (userType !== undefined) updateData.userType = userType;

    // Gérer la mise à jour du profil si nécessaire
    if (firstName !== undefined || lastName !== undefined || phone !== undefined || country !== undefined) {
      updateData.profile = {
        upsert: {
          create: {
            firstName: firstName || '',
            lastName: lastName || '',
            phone: phone || null,
            country: country || null
          },
          update: {
            ...(firstName !== undefined && { firstName }),
            ...(lastName !== undefined && { lastName }),
            ...(phone !== undefined && { phone: phone || null }),
            ...(country !== undefined && { country: country || null })
          }
        }
      };
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        profile: true
      }
    });

    // Log de l'action admin
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'UPDATE_USER',
        resourceType: 'User',
        resourceId: id,
        newValues: body,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: updatedUser,
      message: 'Utilisateur mis à jour avec succès'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(
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

    // Récupérer les infos de l'utilisateur avant suppression
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Supprimer l'utilisateur (cascade supprimera les relations)
    await prisma.user.delete({
      where: { id }
    });

    // Log de l'action admin
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'DELETE_USER',
        resourceType: 'User',
        resourceId: id,
        oldValues: {
          email: user.email,
          userType: user.userType,
          firstName: user.profile?.firstName,
          lastName: user.profile?.lastName
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}