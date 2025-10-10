import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const oauthSession = searchParams.get('oauth_session');
    
    if (!oauthSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Vérifier que la session OAuth existe
    const session = await prisma.oAuthSession.findUnique({
      where: { sessionId: oauthSession },
      include: { client: true }
    });
    
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Rediriger vers l'endpoint d'autorisation avec les paramètres originaux
    const authorizeUrl = new URL('/api/auth/authorize', request.url);
    authorizeUrl.searchParams.set('response_type', session.responseType);
    authorizeUrl.searchParams.set('client_id', session.clientId);
    authorizeUrl.searchParams.set('redirect_uri', session.redirectUri);
    authorizeUrl.searchParams.set('scope', session.scope);
    if (session.state) {
      authorizeUrl.searchParams.set('state', session.state);
    }
    
    return NextResponse.redirect(authorizeUrl);
    
  } catch (error: any) {
    console.error('Continue OAuth error:', error);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
}