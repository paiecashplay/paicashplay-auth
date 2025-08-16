import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '@/lib/oauth';
import { cookies } from 'next/headers';
import { createRedirectUrl, createAbsoluteUrl } from '@/lib/url-utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const response_type = searchParams.get('response_type');
  const client_id = searchParams.get('client_id');
  const redirect_uri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope') || 'openid profile email';
  const state = searchParams.get('state');
  const prompt = searchParams.get('prompt'); // login, consent, select_account
  const signup_type = searchParams.get('signup_type'); // Type de compte pour inscription
  
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
    return NextResponse.redirect(createRedirectUrl('/error?error=invalid_client&description=Client non trouvé'));
  }
  
  // Validate redirect URI
  if (!OAuthService.validateRedirectUri(client, redirect_uri)) {
    return NextResponse.redirect(createRedirectUrl('/error?error=invalid_redirect_uri&description=URL de redirection non autorisée'));
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
  
  if (!sessionToken || prompt === 'login') {
    // Si signup_type est spécifié, rediriger vers signup
    if (signup_type && !sessionToken) {
      const signupUrl = createAbsoluteUrl('/signup');
      signupUrl.searchParams.set('oauth_session', oauthSessionId);
      signupUrl.searchParams.set('type', signup_type);
      return NextResponse.redirect(signupUrl);
    }
    
    // Redirect to login with session ID
    const loginUrl = createAbsoluteUrl('/login');
    loginUrl.searchParams.set('oauth_session', oauthSessionId);
    
    // Si prompt=login, forcer la déconnexion d'abord
    if (prompt === 'login' && sessionToken) {
      const cookieStore = await cookies();
      cookieStore.delete('session_token');
      cookieStore.delete('session-token');
      console.log('🔄 Forced logout due to prompt=login');
    }
    
    return NextResponse.redirect(loginUrl);
  }
  
  // Validate session and get user
  let userId: string;
  let user: any;
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as any;
    userId = decoded.userId;
    
    // Vérifier si l'utilisateur nécessite une réauthentification
    const { prisma } = require('@/lib/prisma');
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });
    
    if (user?.profile?.metadata?.requireReauth) {
      console.log('🔄 User requires re-authentication due to token revocation');
      
      // Supprimer le flag et forcer la reconnexion
      await prisma.userProfile.update({
        where: { userId },
        data: {
          metadata: {
            ...user.profile.metadata,
            requireReauth: false
          }
        }
      });
      
      const cookieStore = await cookies();
      cookieStore.delete('session_token');
      cookieStore.delete('session-token');
      
      const loginUrl = createAbsoluteUrl('/login');
      loginUrl.searchParams.set('oauth_session', oauthSessionId);
      
      return NextResponse.redirect(loginUrl);
    }
  } catch (error) {
    // Invalid session, redirect to login
    const loginUrl = createAbsoluteUrl('/login');
    loginUrl.searchParams.set('oauth_session', oauthSessionId);
    
    return NextResponse.redirect(loginUrl);
  }
  
  // Si prompt=login est spécifié, forcer la réauthentification même si l'utilisateur est connecté
  if (prompt === 'login') {
    const cookieStore = await cookies();
    cookieStore.delete('session_token');
    cookieStore.delete('session-token');
    
    const loginUrl = createAbsoluteUrl('/login');
    loginUrl.searchParams.set('oauth_session', oauthSessionId);
    
    console.log('🔄 Forced re-authentication due to prompt=login');
    return NextResponse.redirect(loginUrl);
  }
  
  // User is already authenticated - redirect to continue with OAuth session
  const continueUrl = createAbsoluteUrl('/api/auth/continue');
  continueUrl.searchParams.set('oauth_session', oauthSessionId);
  
  console.log('✅ User authenticated, redirecting to continue:', continueUrl.toString());
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