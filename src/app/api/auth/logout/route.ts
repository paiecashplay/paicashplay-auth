import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value || cookieStore.get('session-token')?.value;
    
    if (sessionToken) {
      await AuthService.logout(sessionToken);

    }
    
    // Clear both possible session cookies
    cookieStore.delete('session_token');
    cookieStore.delete('session-token');
    

    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error: any) {
    console.error('Logout error:', error);
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}