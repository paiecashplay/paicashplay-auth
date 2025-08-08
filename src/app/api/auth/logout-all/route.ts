import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value || cookieStore.get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 });
    }

    // Get user ID from current session
    let userId: string;
    try {
      const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Expire ALL sessions for this user
    await prisma.userSession.updateMany({
      where: { userId },
      data: { 
        expiresAt: new Date() // Expire immediately
      }
    });

    // Revoke ALL OAuth tokens for this user
    await prisma.accessToken.updateMany({
      where: { userId },
      data: { revoked: true }
    });

    await prisma.refreshToken.updateMany({
      where: { 
        accessToken: {
          userId
        }
      },
      data: { revoked: true }
    });

    // Clear session cookies
    cookieStore.delete('session_token');
    cookieStore.delete('session-token');
    
    console.log(`🔒 Global logout performed for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Logged out from all devices and applications'
    });
    
  } catch (error: any) {
    console.error('Global logout error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}