import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { createRedirectUrl } from '@/lib/url-utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const oauthSessionId = searchParams.get('oauth_session');
  
  if (!oauthSessionId) {
    return NextResponse.redirect(createRedirectUrl('/login'));
  }
  
  // Get OAuth session
  const oauthSession = await prisma.oAuthSession.findUnique({
    where: { 
      id: oauthSessionId,
      expiresAt: { gt: new Date() }
    },
    include: { client: true }
  });
  
  if (!oauthSession) {
    return NextResponse.redirect(createRedirectUrl('/login?error=Session expirée'));
  }
  
  // Check if user is authenticated
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value || cookieStore.get('session-token')?.value;
  
  if (!sessionToken) {
    return NextResponse.redirect(createRedirectUrl(`/login?oauth_session=${oauthSessionId}`));
  }
  
  // Validate session and get user
  let userId: string;
  try {
    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as any;
    userId = decoded.userId;
  } catch (error) {
    return NextResponse.redirect(createRedirectUrl(`/login?oauth_session=${oauthSessionId}`));
  }
  
  // Generate authorization code
  const { generateSecureToken } = require('@/lib/password');
  const authCode = generateSecureToken();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  
  await prisma.authorizationCode.create({
    data: {
      code: authCode,
      clientId: oauthSession.client.clientId,
      userId,
      redirectUri: oauthSession.redirectUri,
      scope: oauthSession.scope || 'openid',
      expiresAt
    }
  });
  
  // Clean up OAuth session
  await prisma.oAuthSession.delete({
    where: { id: oauthSessionId }
  });
  
  // Redirect to client with code
  const redirectUrl = new URL(oauthSession.redirectUri);
  redirectUrl.searchParams.set('code', authCode);
  if (oauthSession.state) redirectUrl.searchParams.set('state', oauthSession.state);
  
  return NextResponse.redirect(redirectUrl);
}