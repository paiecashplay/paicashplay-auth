import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSecureToken } from '@/lib/password';
import { cookies } from 'next/headers';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { socialData, userType, additionalData } = body;

    if (!socialData || !userType) {
      return NextResponse.json({ 
        error: 'Données sociales et type d\'utilisateur requis' 
      }, { status: 400 });
    }

    // Vérifier que l'utilisateur n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: socialData.email }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Un compte existe déjà avec cette adresse email' 
      }, { status: 400 });
    }

    // Récupérer la configuration du provider
    const providerConfig = await prisma.identityProvider.findFirst({
      where: { name: socialData.provider, isEnabled: true }
    });

    if (!providerConfig) {
      return NextResponse.json({ 
        error: 'Provider non configuré' 
      }, { status: 500 });
    }

    // Créer l'utilisateur avec les données complètes
    const profileData = {
      firstName: additionalData.firstName || socialData.firstName,
      lastName: additionalData.lastName || socialData.lastName,
      phone: additionalData.phone || null,
      country: additionalData.country || null,
      language: additionalData.language || 'fr',
      avatarUrl: socialData.avatar,
      ...additionalData.profileData
    };

    const user = await prisma.user.create({
      data: {
        email: socialData.email,
        passwordHash: generateSecureToken(), // Mot de passe temporaire
        userType,
        isVerified: true, // Les providers sociaux vérifient l'email
        profile: {
          create: profileData
        },
        socialAccounts: {
          create: {
            providerId: providerConfig.id,
            providerUserId: socialData.providerUserId,
            email: socialData.email,
            name: `${profileData.firstName} ${profileData.lastName}`.trim(),
            avatar: socialData.avatar,
            accessToken: socialData.accessToken
          }
        }
      },
      include: { profile: true, socialAccounts: true }
    });

    // Créer une session avec token simple
    const sessionToken = generateSecureToken();

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    console.log('Complete signup - Creating session for user:', user.id, user.email);
    console.log('Complete signup - Session token generated:', sessionToken.substring(0, 20) + '...');

    await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken,
        expiresAt,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });
    
    console.log('Complete signup - Session created in database');

    // Définir le cookie de session
    const cookieStore = await cookies();
    cookieStore.set('session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 jours
    });
    
    console.log('Social complete-signup - Session created for user:', user.email);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified,
        profile: user.profile
      },
      message: 'Inscription réussie avec votre compte social'
    });

  } catch (error) {
    console.error('Social signup completion error:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur' 
    }, { status: 500 });
  }
}