import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { OAuthService } from '@/lib/oauth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const oauthSession = searchParams.get('oauth_session');
    
    if (!oauthSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Vérifier que la session OAuth existe
    const session = await prisma.oAuthSession.findUnique({
      where: { id: oauthSession },
      include: { client: true }
    });
    
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Vérifier que l'utilisateur est connecté
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value || cookieStore.get('session-token')?.value;
    
    if (!sessionToken) {
      // Rediriger vers login avec la session OAuth
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('oauth_session', oauthSession);
      return NextResponse.redirect(loginUrl);
    }
    
    // Décoder le token pour obtenir l'ID utilisateur
    let userId: string;
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
    } catch (error) {
      // Token invalide, rediriger vers login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('oauth_session', oauthSession);
      return NextResponse.redirect(loginUrl);
    }
    
    // Générer le code d'autorisation
    const code = await OAuthService.createAuthorizationCode(
      session.clientId,
      userId,
      session.redirectUri,
      session.scope || 'openid profile email'
    );
    
    // Supprimer la session OAuth (usage unique)
    await prisma.oAuthSession.delete({
      where: { id: oauthSession }
    });
    
    // Rediriger vers le client avec le code
    const redirectUrl = new URL(session.redirectUri);
    redirectUrl.searchParams.set('code', code);
    if (session.state) {
      redirectUrl.searchParams.set('state', session.state);
    }
    
    return NextResponse.redirect(redirectUrl);
    
  } catch (error: any) {
    console.error('Continue OAuth error:', error);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
}