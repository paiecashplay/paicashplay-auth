import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { RateLimitService } from '@/lib/rate-limit';
import { cookies } from 'next/headers';

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

export async function POST(request: NextRequest) {
  const ipAddress = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  try {
    // Rate limiting
    const rateLimitKey = RateLimitService.generateKey(ipAddress, 'login');
    const rateLimit = await RateLimitService.checkRateLimit(rateLimitKey, 'login');
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: 'Too many login attempts. Please try again later.',
        resetTime: rateLimit.resetTime
      }, { status: 429 });
    }
    
    const body = await request.json();
    const { email, password } = body;
    
    // Validation
    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password are required' 
      }, { status: 400 });
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }
    
    // Login user
    const { user } = await AuthService.loginUser(
      { email: email.toLowerCase().trim(), password }, 
      ipAddress, 
      userAgent
    );
    
    // Generate JWT session token
    const jwt = require('jsonwebtoken');
    const sessionToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    // Create session in database
    const { prisma } = require('@/lib/prisma');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken,
        expiresAt,
        ipAddress,
        userAgent
      }
    });
    
    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });
    

    
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified
      }
    });
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toISOString());
    
    return response;
    
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.message.includes('Too many login attempts')) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 429 });
    }
    
    if (error.message === 'Invalid credentials') {
      return NextResponse.json({ 
        error: 'Invalid email or password' 
      }, { status: 401 });
    }
    
    if (error.message === 'Account is deactivated') {
      return NextResponse.json({ 
        error: 'Your account has been deactivated. Please contact support.' 
      }, { status: 403 });
    }
    
    if (error.message.includes('Account is temporarily locked')) {
      return NextResponse.json({ 
        error: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.' 
      }, { status: 423 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}