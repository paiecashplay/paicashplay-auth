import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';
import { generateSecureToken } from '@/lib/password';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    if (user.isVerified) {
      return NextResponse.json({ 
        error: 'Email is already verified' 
      }, { status: 400 });
    }
    
    // Delete existing verification tokens
    await prisma.emailVerification.deleteMany({
      where: { userId: user.id }
    });
    
    // Create new verification token
    const verificationToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt
      }
    });
    
    // Récupérer oauth_session depuis l'URL
    const url = new URL(request.url);
    const oauthSession = url.searchParams.get('oauth_session');
    
    // Send verification email
    await EmailService.sendVerificationEmail(
      user.email,
      user.profile?.firstName || 'Utilisateur',
      user.profile?.lastName || '',
      verificationToken,
      user.userType as any,
      oauthSession || undefined
    );
    
    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully'
    });
    
  } catch (error: any) {
    console.error('Resend verification error:', error);
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}