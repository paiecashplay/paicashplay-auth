import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '@/lib/oauth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const response_type = searchParams.get('response_type');
  const client_id = searchParams.get('client_id');
  const redirect_uri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope') || 'openid profile email';
  const state = searchParams.get('state');
  
  // Validate required parameters
  if (!response_type || !client_id || !redirect_uri) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  
  if (response_type !== 'code') {
    return NextResponse.json({ error: 'unsupported_response_type' }, { status: 400 });
  }
  
  // Validate client
  const client = await OAuthService.validateClient(client_id);
  if (!client) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 400 });
  }
  
  // Validate redirect URI
  if (!OAuthService.validateRedirectUri(client, redirect_uri)) {
    return NextResponse.json({ error: 'invalid_redirect_uri' }, { status: 400 });
  }
  
  // Validate scope
  if (!OAuthService.validateScope(client, scope)) {
    return NextResponse.json({ error: 'invalid_scope' }, { status: 400 });
  }
  
  // Check if user is authenticated
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session-token')?.value;
  
  if (!sessionToken) {
    // Redirect to login with OAuth parameters
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('client_id', client_id);
    loginUrl.searchParams.set('redirect_uri', redirect_uri);
    loginUrl.searchParams.set('scope', scope);
    if (state) loginUrl.searchParams.set('state', state);
    
    return NextResponse.redirect(loginUrl);
  }
  
  // Validate session and get user
  let userId: string;
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as any;
    userId = decoded.userId;
  } catch (error) {
    // Invalid session, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('client_id', client_id);
    loginUrl.searchParams.set('redirect_uri', redirect_uri);
    loginUrl.searchParams.set('scope', scope);
    if (state) loginUrl.searchParams.set('state', state);
    
    return NextResponse.redirect(loginUrl);
  }
  
  // Check if user has already consented to this client
  const { prisma } = require('@/lib/prisma');
  const existingConsent = await prisma.userConsent.findUnique({
    where: {
      userId_clientId: {
        userId,
        clientId: client.id
      }
    }
  });
  
  if (existingConsent) {
    // User has already consented, generate code directly
    const { generateSecureToken } = require('@/lib/password');
    const authCode = generateSecureToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await prisma.authorizationCode.create({
      data: {
        code: authCode,
        clientId: client.id,
        userId,
        redirectUri: redirect_uri,
        scope: scope || 'openid',
        expiresAt
      }
    });
    
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set('code', authCode);
    if (state) redirectUrl.searchParams.set('state', state);
    
    return NextResponse.redirect(redirectUrl);
  }
  
  // Redirect to consent page
  const consentUrl = new URL('/consent', request.url);
  consentUrl.searchParams.set('client_id', client_id);
  consentUrl.searchParams.set('redirect_uri', redirect_uri);
  consentUrl.searchParams.set('scope', scope);
  if (state) consentUrl.searchParams.set('state', state);
  
  return NextResponse.redirect(consentUrl);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const client_id = formData.get('client_id') as string;
  const redirect_uri = formData.get('redirect_uri') as string;
  const scope = formData.get('scope') as string;
  const state = formData.get('state') as string;
  const user_id = formData.get('user_id') as string; // From session
  
  if (!client_id || !redirect_uri || !user_id) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  
  // Generate authorization code
  const code = await OAuthService.createAuthorizationCode(client_id, user_id, redirect_uri, scope);
  
  // Redirect back to client with code
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('code', code);
  if (state) redirectUrl.searchParams.set('state', state);
  
  return NextResponse.redirect(redirectUrl);
}