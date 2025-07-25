import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { verifyPassword, hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: 'Current password and new password are required' 
      }, { status: 400 });
    }
    
    if (newPassword.length < 8) {
      return NextResponse.json({ 
        error: 'New password must be at least 8 characters' 
      }, { status: 400 });
    }
    
    // Get current user
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true }
    });
    
    if (!userData) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, userData.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ 
        error: 'Current password is incorrect' 
      }, { status: 400 });
    }
    
    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);
    
    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    });
    
    // Invalidate all sessions except current one
    const currentSessionToken = request.cookies.get('session_token')?.value;
    await prisma.userSession.deleteMany({
      where: {
        userId: user.id,
        sessionToken: { not: currentSessionToken }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
});