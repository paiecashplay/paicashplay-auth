import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from './auth-service';
import { AdminAuthService } from './admin-auth';
import { ensurePrismaReady } from './prisma';
import { cookies } from 'next/headers';

export function requireAuth(handler: (request: NextRequest, user: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      await ensurePrismaReady();
      
      const sessionToken = request.cookies.get('session_token')?.value;
      
      if (!sessionToken) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      
      const user = await AuthService.validateSession(sessionToken);
      
      if (!user) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
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
        
        const sessionToken = request.cookies.get('session_token')?.value;
        
        if (!sessionToken) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        
        const user = await AuthService.validateSession(sessionToken);
        
        if (!user) {
          return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
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