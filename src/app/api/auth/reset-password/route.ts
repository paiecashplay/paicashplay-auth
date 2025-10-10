import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, generateSecureToken } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;
    
    if (!token || !password) {
      return NextResponse.json({ 
        error: 'Token and password are required' 
      }, { status: 400 });
    }
    
    if (password.length < 8) {
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters' 
      }, { status: 400 });
    }
    
    // Find valid reset token
    const resetToken = await prisma.passwordReset.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: true
      }
    });
    
    if (!resetToken) {
      return NextResponse.json({ 
        error: 'Invalid or expired reset token' 
      }, { status: 400 });
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(password);
    
    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: hashedPassword }
    });
    
    // Mark token as used
    await prisma.passwordReset.update({
      where: { id: resetToken.id },
      data: { used: true }
    });
    
    // Créer une session pour l'utilisateur
    const sessionToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await prisma.userSession.create({
      data: {
        userId: resetToken.userId,
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
    
    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });
    
  } catch (error: any) {
    console.error('Password reset error:', error);
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}