import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { createAbsoluteUrl } from '@/lib/url-utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope');
  const state = searchParams.get('state');
  
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value || cookieStore.get('session-token')?.value;
  
  if (!sessionToken) {
    const loginUrl = createAbsoluteUrl('/login');
    if (clientId) loginUrl.searchParams.set('client_id', clientId);
    if (redirectUri) loginUrl.searchParams.set('redirect_uri', redirectUri);
    if (scope) loginUrl.searchParams.set('scope', scope);
    if (state) loginUrl.searchParams.set('state', state);
    
    return NextResponse.redirect(loginUrl);
  }
  
  if (clientId && redirectUri) {
    const oauthSessionId = require('crypto').randomUUID();
    
    try {
      await prisma.oAuthSession.create({
        data: {
          id: oauthSessionId,
          clientId,
          redirectUri,
          scope: scope || 'openid profile email',
          state,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        }
      });
      
      const continueUrl = createAbsoluteUrl('/api/auth/continue');
      continueUrl.searchParams.set('oauth_session', oauthSessionId);
      
      return NextResponse.redirect(continueUrl);
    } catch (error) {
      const authorizeUrl = createAbsoluteUrl('/api/auth/authorize');
      authorizeUrl.searchParams.set('response_type', 'code');
      authorizeUrl.searchParams.set('client_id', clientId);
      authorizeUrl.searchParams.set('redirect_uri', redirectUri);
      if (scope) authorizeUrl.searchParams.set('scope', scope);
      if (state) authorizeUrl.searchParams.set('state', state);
      
      return NextResponse.redirect(authorizeUrl);
    }
  } else {
    return NextResponse.redirect(createAbsoluteUrl('/dashboard'));
  }
}