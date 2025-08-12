import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRedirectUrl } from '@/lib/url-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const resolvedParams = await params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(createRedirectUrl(`/login?error=${encodeURIComponent(error)}`));
  }

  if (!code || !state) {
    return NextResponse.redirect(createRedirectUrl('/login?error=Invalid callback'));
  }

  try {
    // Décoder l'état
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch (e) {
      console.error('Failed to decode state:', e);
      return NextResponse.redirect(createRedirectUrl('/login?error=Invalid state'));
    }
    
    const { mode, oauthSession } = stateData;
    console.log('OAuth session from state:', oauthSession);

    // Échanger le code contre un access token
    const accessToken = await exchangeCodeForToken(resolvedParams.provider, code);
    
    if (!accessToken) {
      return NextResponse.redirect(createRedirectUrl('/login?error=Failed to get access token'));
    }

    // Authentifier avec notre API
    const authResponse = await fetch(createRedirectUrl('/api/auth/social'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: resolvedParams.provider,
        access_token: accessToken,
        mode
      })
    });

    const authData = await authResponse.json();

    if (!authResponse.ok) {
      return NextResponse.redirect(createRedirectUrl(`/login?error=${encodeURIComponent(authData.error)}`));
    }

    console.log('🔍 Social auth successful, user:', authData.user?.email);

    // Si c'est un flux OAuth, rediriger vers l'endpoint continue
    if (oauthSession) {
      console.log('🔄 OAuth flow detected, redirecting to continue with session:', oauthSession);
      return NextResponse.redirect(createRedirectUrl(`/api/auth/continue?oauth_session=${oauthSession}`));
    }

    // Sinon, rediriger vers le dashboard
    console.log('🔄 Normal flow, redirecting to dashboard');
    return NextResponse.redirect(createRedirectUrl('/dashboard'));

  } catch (error) {
    console.error('Social callback error:', error);
    return NextResponse.redirect(createRedirectUrl('/login?error=Authentication failed'));
  }
}

async function exchangeCodeForToken(provider: string, code: string): Promise<string | null> {
  const redirectUri = createRedirectUrl(`/auth/${provider}/callback`);
  
  try {
    let tokenUrl: string;
    let clientId: string;
    let clientSecret: string;
    
    switch (provider) {
      case 'google':
        tokenUrl = 'https://oauth2.googleapis.com/token';
        clientId = process.env.GOOGLE_CLIENT_ID!;
        clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
        break;
      case 'facebook':
        tokenUrl = 'https://graph.facebook.com/v18.0/oauth/access_token';
        clientId = process.env.FACEBOOK_CLIENT_ID!;
        clientSecret = process.env.FACEBOOK_CLIENT_SECRET!;
        break;
      case 'linkedin':
        tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
        clientId = process.env.LINKEDIN_CLIENT_ID!;
        clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
        break;
      default:
        return null;
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error(`Error exchanging ${provider} code:`, error);
    return null;
  }
}