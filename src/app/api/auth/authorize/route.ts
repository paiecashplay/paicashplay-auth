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
    return NextResponse.redirect(new URL('/error?error=invalid_client&description=Client non trouvé', request.url));
  }
  
  // Validate redirect URI
  if (!OAuthService.validateRedirectUri(client, redirect_uri)) {
    return NextResponse.redirect(new URL('/error?error=invalid_redirect_uri&description=URL de redirection non autorisée', request.url));
  }
  
  // Validate scope
  if (!OAuthService.validateScope(client, scope)) {
    return NextResponse.json({ error: 'invalid_scope' }, { status: 400 });
  }
  
  // Check if user is authenticated
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value || cookieStore.get('session-token')?.value;
  
  // Always create OAuth session for OAuth flows
  const { prisma } = require('@/lib/prisma');
  const oauthSessionId = require('crypto').randomUUID();
  
  await prisma.oAuthSession.create({
    data: {
      id: oauthSessionId,
      clientId: client.client_id,
      redirectUri: redirect_uri,
      scope,
      state,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    }
  });
  
  if (!sessionToken) {
    // Redirect to login with session ID
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('oauth_session', oauthSessionId);
    
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
    loginUrl.searchParams.set('oauth_session', oauthSessionId);
    
    return NextResponse.redirect(loginUrl);
  }
  
  // User is already authenticated - redirect to continue with OAuth session
  const continueUrl = new URL('/api/auth/continue', request.url);
  continueUrl.searchParams.set('oauth_session', oauthSessionId);
  
  return NextResponse.redirect(continueUrl);
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