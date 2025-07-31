import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/admin-service';
import { requireAdmin } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { cookies } from 'next/headers';
import { AdminAuthService } from '@/lib/admin-auth';

// POST - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
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
      password,
      firstName,
      lastName,
      phone,
      country,
      userType,
      isVerified,
      isActive
    } = body;

    // Validation des champs requis
    if (!email || !password || !firstName || !lastName || !userType) {
      return NextResponse.json({ 
        error: 'Champs requis manquants' 
      }, { status: 400 });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Un utilisateur avec cet email existe déjà' 
      }, { status: 400 });
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password);

    // Créer l'utilisateur avec son profil
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        userType,
        isVerified: isVerified || false,
        isActive: isActive !== false,
        profile: {
          create: {
            firstName,
            lastName,
            phone: phone || null,
            country: country || null
          }
        }
      },
      include: {
        profile: true
      }
    });

    // Log de l'action admin
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'CREATE_USER',
        resourceType: 'User',
        resourceId: newUser.id,
        newValues: {
          email,
          userType,
          firstName,
          lastName,
          isVerified,
          isActive
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'Utilisateur créé avec succès'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export const GET = requireAdmin(async (request: NextRequest, admin: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userType = searchParams.get('userType') || undefined;
    const search = searchParams.get('search') || undefined;
    
    const result = await AdminService.getUsers(page, limit, userType, search);
    
    // Ensure pagination object exists
    if (!result.pagination) {
      result.pagination = {
        page: 1,
        limit: 50,
        total: result.users?.length || 0,
        totalPages: 1
      };
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});