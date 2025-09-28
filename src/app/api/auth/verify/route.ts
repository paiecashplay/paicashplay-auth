import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { EmailService } from '@/lib/email-service';
import { prisma } from '@/lib/prisma';
import { generateSecureToken } from '@/lib/password';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;
    
    if (!token) {
      return NextResponse.json({ 
        error: 'Verification token is required' 
      }, { status: 400 });
    }
    
    // Get user info before verification
    const verification = await prisma.emailVerification.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          include: {
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });
    
    if (!verification) {
      return NextResponse.json({ 
        error: 'Invalid or expired verification token' 
      }, { status: 400 });
    }
    
    // Verify email
    await AuthService.verifyEmail(token);
    
    // Créer une session pour l'utilisateur vérifié
    const sessionToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await prisma.userSession.create({
      data: {
        userId: verification.user.id,
        sessionToken,
        expiresAt,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });
    
    // Définir le cookie de session
    const cookieStore = await cookies();
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 jours
    });
    
    // Send account confirmed email
    await EmailService.sendAccountConfirmedEmail(
      verification.user.email,
      verification.user.profile?.firstName || 'Utilisateur',
      verification.user.profile?.lastName || '',
      verification.user.userType as any
    );
    
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. Welcome to PaieCashPlay!'
    });
    
  } catch (error: any) {
    console.error('Email verification error:', error);
    
    if (error.message === 'Invalid or expired verification token') {
      return NextResponse.json({ 
        error: 'Invalid or expired verification token' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}