import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;
    
    if (!token) {
      return NextResponse.json({ 
        error: 'Token is required' 
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
      }
    });
    
    if (!resetToken) {
      return NextResponse.json({ 
        error: 'Invalid or expired token' 
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Token is valid'
    });
    
  } catch (error: any) {
    console.error('Validate reset token error:', error);
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}