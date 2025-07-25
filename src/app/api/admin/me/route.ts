import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/admin-auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    const admin = await AdminAuthService.validateAdminSession(sessionToken);
    if (!admin) {
      return NextResponse.json({ 
        error: 'Invalid session' 
      }, { status: 401 });
    }
    
    return NextResponse.json({ admin });
    
  } catch (error) {
    console.error('Admin me error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}