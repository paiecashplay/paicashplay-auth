import { NextRequest, NextResponse } from 'next/server';
import { IdentityProviderService } from '@/lib/identity-providers';
import { AuthService } from '@/lib/auth-service';
import { prisma } from '@/lib/prisma';
import { createRedirectUrl } from '@/lib/url-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(createRedirectUrl(`/login?error=${error}`));
    }

    if (!code || !state) {
      return NextResponse.redirect(createRedirectUrl('/login?error=missing_params'));
    }

    const provider = await IdentityProviderService.getProvider('linkedin');
    if (!provider) {
      return NextResponse.redirect(createRedirectUrl('/login?error=provider_not_found'));
    }

    const tokens = await IdentityProviderService.exchangeCodeForToken(provider, code);
    if (!tokens.access_token) {
      return NextResponse.redirect(createRedirectUrl('/login?error=token_exchange_failed'));
    }

    const profile = await IdentityProviderService.getUserProfile(provider, tokens.access_token);
    
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return NextResponse.redirect(createRedirectUrl('/login?error=invalid_state'));
    }

    const existingUser = await IdentityProviderService.findUserBySocialAccount(provider.id, profile.id);
    
    if (existingUser) {
      const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
      const jwt = require('jsonwebtoken');
      const sessionToken = jwt.sign(
        { userId: existingUser.id, email: existingUser.email },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );
      
      // Créer la session en base
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await prisma.userSession.create({
        data: {
          userId: existingUser.id,
          sessionToken,
          expiresAt,
          ipAddress: clientIP,
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });
      

      
      // Check if this is an OAuth flow
      const oauthSession = stateData.oauthSession;
      let redirectUrl = '/dashboard';
      
      if (oauthSession) {
        redirectUrl = `/api/auth/continue?oauth_session=${oauthSession}`;
      }
      
      const response = NextResponse.redirect(createRedirectUrl(redirectUrl));
      response.cookies.set('session_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60
      });
      
      return response;
    } else {
      const signupData = {
        provider: 'linkedin',
        profile,
        tokens,
        mode: stateData.mode
      };
      
      const tempToken = btoa(JSON.stringify(signupData));
      return NextResponse.redirect(createRedirectUrl(`/signup?social=${tempToken}`));
    }
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    return NextResponse.redirect(createRedirectUrl('/login?error=callback_failed'));
  }
}