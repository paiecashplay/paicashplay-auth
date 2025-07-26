import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { EmailService } from '@/lib/email-service';
import { prisma } from '@/lib/prisma';

// Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, newPassword } = body;
    
    // If token and newPassword provided, reset password
    if (token && newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json({ 
          error: 'Password must be at least 8 characters' 
        }, { status: 400 });
      }
      
      await AuthService.resetPassword(token, newPassword);
      
      return NextResponse.json({
        success: true,
        message: 'Password reset successfully. You can now login with your new password.'
      });
    }
    
    // Otherwise, request password reset
    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }
    
    // Get user info for email
    const user = await prisma.user.findFirst({
      where: { 
        email: email.toLowerCase().trim(), 
        isActive: true 
      },
      include: {
        profile: {
          select: {
            firstName: true
          }
        }
      }
    });
    
    const { resetToken } = await AuthService.requestPasswordReset(email);
    
    // Send reset email only if user exists
    if (user && resetToken) {
      await EmailService.sendPasswordResetEmail(
        user.email, 
        user.profile?.firstName || 'Utilisateur', 
        resetToken
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, you will receive a password reset link.'
    });
    
  } catch (error: any) {
    console.error('Password reset error:', error);
    
    if (error.message === 'Invalid or expired reset token') {
      return NextResponse.json({ 
        error: 'Invalid or expired reset token' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}