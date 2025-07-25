import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/admin-auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ 
        error: 'Username and password are required' 
      }, { status: 400 });
    }
    
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    const result = await AdminAuthService.loginAdmin(
      username, 
      password, 
      ipAddress, 
      userAgent
    );
    
    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });
    
    return NextResponse.json({
      success: true,
      admin: result.admin
    });
    
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Login failed' 
    }, { status: 401 });
  }
}