import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { EmailService } from '@/lib/email-service';
import { validateEmail, validatePassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
    
    if (!['donor', 'federation', 'club', 'player', 'company'].includes(userType)) {
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
    
    // Send verification email
    await EmailService.sendVerificationEmail(email, firstName, lastName, verificationToken, userType as any);
    
    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      userId,
      redirectUrl: `/verify-email?email=${encodeURIComponent(email)}`
    });
    
  } catch (error: any) {
    console.error('Signup error:', error);
    
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