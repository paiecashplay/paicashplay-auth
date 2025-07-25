import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { IdentityProviderService } from '@/lib/identity-providers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { socialToken, userType, firstName, lastName, phone, country, ...additionalData } = body;

    if (!socialToken || !userType || !firstName || !lastName) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Decode social data
    let socialData;
    try {
      socialData = JSON.parse(atob(socialToken));
    } catch {
      return NextResponse.json({ 
        error: 'Invalid social token' 
      }, { status: 400 });
    }

    const { provider, profile, tokens } = socialData;

    // Check if user already exists with this email
    const existingUser = await AuthService.findUserByEmail(profile.email);
    if (existingUser) {
      return NextResponse.json({ 
        error: 'Un compte existe déjà avec cette adresse email' 
      }, { status: 400 });
    }

    // Create user account
    const user = await AuthService.createUser({
      email: profile.email,
      password: null, // No password for social accounts
      userType,
      firstName,
      lastName,
      phone: phone || null,
      country: country || null,
      isVerified: true, // Social accounts are pre-verified
      ...additionalData
    });

    // Link social account
    const providerRecord = await IdentityProviderService.getProvider(provider);
    if (providerRecord) {
      await IdentityProviderService.linkSocialAccount(
        user.id,
        providerRecord.id,
        profile,
        tokens
      );
    }

    // Create session
    const sessionToken = await AuthService.createSession(
      user.id,
      request.headers.get('user-agent') || '',
      request.ip || ''
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        profile: user.profile
      }
    });

    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Social signup error:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la création du compte' 
    }, { status: 500 });
  }
}