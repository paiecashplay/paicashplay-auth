import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { EmailService } from '@/lib/email-service';
import { validateEmail, validatePassword } from '@/lib/auth';

const VALID_USER_TYPES = ['donor', 'federation', 'club', 'player', 'company', 'affiliate', 'academy', 'school', 'association'] as const;

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid JSON format' 
      }, { status: 400 });
    }
    const { email, password, firstName, lastName, userType, phone, country, isPartner, metadata } = body;
    
    // Validation
    if (!email || !password || !firstName || !lastName || !userType) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    if (!validateEmail(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }
    
    if (!validatePassword(password)) {
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters' 
      }, { status: 400 });
    }
    
    if (!VALID_USER_TYPES.includes(userType)) {
      return NextResponse.json({ 
        error: 'Invalid user type' 
      }, { status: 400 });
    }
    
    // Create user
    const { userId, verificationToken } = await AuthService.createUser({
      email,
      password,
      firstName,
      lastName,
      userType,
      phone,
      country,
      isPartner: isPartner || false,
      metadata
    });
    
    // Récupérer les paramètres OAuth depuis l'URL
    const url = new URL(request.url);
    const clientId = url.searchParams.get('client_id');
    const redirectUri = url.searchParams.get('redirect_uri');
    const scope = url.searchParams.get('scope');
    const state = url.searchParams.get('state');
    
    // Récupérer oauth_session depuis l'URL
    const oauthSession = url.searchParams.get('oauth_session');
    
    // Send verification email
    await EmailService.sendVerificationEmail(
      email, 
      firstName, 
      lastName, 
      verificationToken, 
      userType as any,
      oauthSession || undefined
    );
    
    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      userId,
      redirectUrl: `/verify-email?email=${encodeURIComponent(email)}`
    });
    
  } catch (error: any) {
    // Utiliser un logger structuré en production
    if (process.env.NODE_ENV === 'development') {
      console.error('Signup error:', error);
    }
    
    if (error.message === 'User already exists') {
      return NextResponse.json({ 
        error: 'An account with this email already exists' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}