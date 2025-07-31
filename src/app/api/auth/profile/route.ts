import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET - Récupérer le profil utilisateur (OAuth)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Access token required' 
      }, { status: 401 });
    }

    const accessToken = authHeader.substring(7);

    // Vérifier le token d'accès
    const tokenRecord = await prisma.accessToken.findFirst({
      where: {
        tokenHash: accessToken,
        revoked: false,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });

    if (!tokenRecord) {
      return NextResponse.json({ 
        error: 'Invalid or expired access token' 
      }, { status: 401 });
    }

    const { user } = tokenRecord;
    const scopes = tokenRecord.scope?.split(' ') || [];

    // Construire la réponse selon les scopes autorisés
    const profileData: any = {};

    if (scopes.includes('openid')) {
      profileData.sub = user.id;
    }

    if (scopes.includes('email')) {
      profileData.email = user.email;
      profileData.email_verified = user.isVerified;
    }

    if (scopes.includes('profile') && user.profile) {
      profileData.name = `${user.profile.firstName} ${user.profile.lastName}`.trim();
      profileData.given_name = user.profile.firstName;
      profileData.family_name = user.profile.lastName;
      profileData.phone_number = user.profile.phone;
      profileData.locale = user.profile.language || 'fr';
      profileData.picture = user.profile.avatarUrl;
      profileData.updated_at = Math.floor(new Date(user.profile.updatedAt).getTime() / 1000);
    }

    // Ajouter des informations spécifiques PaieCashPlay
    profileData.user_type = user.userType;
    profileData.is_active = user.isActive;
    profileData.member_since = Math.floor(new Date(user.createdAt).getTime() / 1000);

    if (user.profile?.isPartner) {
      profileData.is_partner = true;
    }

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// PUT - Mettre à jour le profil utilisateur (OAuth)
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Access token required' 
      }, { status: 401 });
    }

    const accessToken = authHeader.substring(7);

    // Vérifier le token d'accès
    const tokenRecord = await prisma.accessToken.findFirst({
      where: {
        tokenHash: accessToken,
        revoked: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!tokenRecord) {
      return NextResponse.json({ 
        error: 'Invalid or expired access token' 
      }, { status: 401 });
    }

    const scopes = tokenRecord.scope?.split(' ') || [];
    
    // Vérifier que l'application a les permissions pour modifier le profil
    if (!scopes.includes('profile')) {
      return NextResponse.json({ 
        error: 'Insufficient scope for profile modification' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { given_name, family_name, phone_number, locale } = body;

    // Mettre à jour le profil
    const updateData: any = {};
    if (given_name !== undefined) updateData.firstName = given_name;
    if (family_name !== undefined) updateData.lastName = family_name;
    if (phone_number !== undefined) updateData.phone = phone_number;
    if (locale !== undefined) updateData.language = locale;

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId: tokenRecord.userId },
      create: {
        userId: tokenRecord.userId,
        firstName: given_name || '',
        lastName: family_name || '',
        phone: phone_number || null,
        language: locale || 'fr'
      },
      update: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        given_name: updatedProfile.firstName,
        family_name: updatedProfile.lastName,
        phone_number: updatedProfile.phone,
        locale: updatedProfile.language,
        updated_at: Math.floor(new Date(updatedProfile.updatedAt).getTime() / 1000)
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}