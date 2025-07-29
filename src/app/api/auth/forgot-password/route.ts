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
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If this email exists, a reset link has been sent'
      });
    }
    
    // Delete existing reset tokens
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id }
    });
    
    // Create new reset token
    const resetToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt
      }
    });
    
    // Send reset email
    await EmailService.sendPasswordResetEmail(
      user.email,
      user.profile?.firstName || 'Utilisateur',
      resetToken
    );
    
    return NextResponse.json({
      success: true,
      message: 'Reset email sent successfully'
    });
    
  } catch (error: any) {
    console.error('Forgot password error:', error);
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}