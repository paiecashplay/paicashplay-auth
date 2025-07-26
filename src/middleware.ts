import { NextRequest, NextResponse } from 'next/server';
// Rate limiting will be handled in API routes for now

const ALLOWED_ORIGINS = [
  'https://paiecashplay.com',
  'https://app.paiecashplay.com',
  'https://admin.paiecashplay.com',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:3001'] : [])
];

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

function generateCSRFToken(): string {
  // Use Web Crypto API for Edge Runtime compatibility
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const origin = request.headers.get('origin');
  const clientIP = getClientIP(request);
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // CORS for OAuth endpoints
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }
    
    // Rate limiting is handled in individual API routes
  }
  
  // CSRF protection for forms (skip for admin and auth endpoints)
  if (request.method === 'POST' && 
      !request.nextUrl.pathname.startsWith('/api/auth/') && 
      !request.nextUrl.pathname.startsWith('/api/admin/')) {
    const csrfToken = request.headers.get('x-csrf-token');
    const sessionCSRF = request.cookies.get('csrf-token')?.value;
    
    if (!csrfToken || csrfToken !== sessionCSRF) {
      return new Response('CSRF token mismatch', { status: 403 });
    }
  }
  
  // Generate CSRF token for new sessions
  if (!request.cookies.get('csrf-token')) {
    const csrfToken = generateCSRFToken();
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24 hours
    });
  }
  
  // OAuth redirects
  if (request.nextUrl.pathname === '/oauth/authorize') {
    return NextResponse.redirect(new URL('/api/auth/authorize', request.url));
  }
  if (request.nextUrl.pathname === '/oauth/token') {
    return NextResponse.redirect(new URL('/api/auth/token', request.url));
  }
  if (request.nextUrl.pathname === '/oauth/userinfo') {
    return NextResponse.redirect(new URL('/api/auth/userinfo', request.url));
  }
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/oauth/:path*',
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};