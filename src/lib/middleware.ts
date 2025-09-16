import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from './auth-service';
import { AdminAuthService } from './admin-auth';
import { ensurePrismaReady } from './prisma';
import { cookies } from 'next/headers';

export function requireAuth(handler: (request: NextRequest, user: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      await ensurePrismaReady();
      
      const sessionToken = request.cookies.get('session_token')?.value || request.cookies.get('session-token')?.value;
      
      if (!sessionToken) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      
      // Try JWT validation first
      let user;
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as any;
        
        // Get user from database and verify session is still valid
        const { prisma } = require('./prisma');
        const userSession = await prisma.userSession.findFirst({
          where: {
            userId: decoded.userId,
            sessionToken,
            expiresAt: { gt: new Date() } // Vérifier que la session n'est pas expirée
          }
        });
        
        if (!userSession) {
          return NextResponse.json({ error: 'Session expired or invalid' }, { status: 401 });
        }
        
        // Récupérer les données utilisateur fraîches depuis la base de données
        user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { profile: true }
        });
        
        console.log('🔑 [MIDDLEWARE] Fresh user data:', {
          id: user?.id,
          email: user?.email,
          profileAvatarUrl: user?.profile?.avatarUrl,
          profileUpdatedAt: user?.profile?.updatedAt
        });
        
        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }
      } catch (jwtError) {
        // Fallback to old session validation
        const authResult = await AuthService.validateSession(sessionToken);
        
        if (!authResult.success || !authResult.user) {
          return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }
        
        user = authResult.user;
      }
      
      return handler(request, user);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

export function requireUserType(allowedTypes: string[]) {
  return function(handler: (request: NextRequest, user: any) => Promise<NextResponse>) {
    return async (request: NextRequest) => {
      try {
        await ensurePrismaReady();
        
        const sessionToken = request.cookies.get('session_token')?.value || request.cookies.get('session-token')?.value;
        
        if (!sessionToken) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        
        // Try JWT validation first
        let user;
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as any;
          
          // Get user from database and verify session is still valid
          const { prisma } = require('./prisma');
          const userSession = await prisma.userSession.findFirst({
            where: {
              userId: decoded.userId,
              sessionToken,
              expiresAt: { gt: new Date() } // Vérifier que la session n'est pas expirée
            }
          });
          
          if (!userSession) {
            return NextResponse.json({ error: 'Session expired or invalid' }, { status: 401 });
          }
          
          // Récupérer les données utilisateur fraîches depuis la base de données
          user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { profile: true }
          });
          
          if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
          }
        } catch (jwtError) {
          // Fallback to old session validation
          const authResult = await AuthService.validateSession(sessionToken);
          
          if (!authResult.success || !authResult.user) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
          }
          
          user = authResult.user;
        }
        
        if (!allowedTypes.includes(user.userType)) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        
        return handler(request, user);
      } catch (error) {
        console.error('Auth middleware error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    };
  };
}

export function requireAdmin(handler: (request: NextRequest, admin: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      await ensurePrismaReady();
      
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get('admin_session')?.value;
      
      if (!sessionToken) {
        return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
      }
      
      const admin = await AdminAuthService.validateAdminSession(sessionToken);
      
      if (!admin) {
        return NextResponse.json({ error: 'Invalid admin session' }, { status: 401 });
      }
      
      return handler(request, admin);
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}