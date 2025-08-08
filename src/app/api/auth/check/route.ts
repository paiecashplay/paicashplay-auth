import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value || request.cookies.get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    // Try JWT validation first
    let user;
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as any;
      
      // Get user from database and verify session is still valid
      const { prisma } = require('@/lib/prisma');
      const userSession = await prisma.userSession.findFirst({
        where: {
          userId: decoded.userId,
          sessionToken,
          expiresAt: { gt: new Date() } // Vérifier que la session n'est pas expirée
        },
        include: {
          user: { include: { profile: true } }
        }
      });
      
      if (!userSession || !userSession.user) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
      }
      
      user = userSession.user;
    } catch (jwtError) {
      // Fallback to old session validation
      const authResult = await AuthService.validateSession(request);
      
      if (!authResult.success || !authResult.user) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
      }
      
      user = authResult.user;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified,
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}