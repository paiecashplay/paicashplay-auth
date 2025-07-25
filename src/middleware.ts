import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // CORS headers for OAuth endpoints
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    const response = NextResponse.next();
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }
    
    return response;
  }
  
  // Redirect root OAuth paths to proper endpoints
  if (request.nextUrl.pathname === '/oauth/authorize') {
    return NextResponse.redirect(new URL('/api/auth/authorize', request.url));
  }
  
  if (request.nextUrl.pathname === '/oauth/token') {
    return NextResponse.redirect(new URL('/api/auth/token', request.url));
  }
  
  if (request.nextUrl.pathname === '/oauth/userinfo') {
    return NextResponse.redirect(new URL('/api/auth/userinfo', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/auth/:path*',
    '/oauth/:path*',
    '/admin/:path*'
  ]
};