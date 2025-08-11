import { NextRequest, NextResponse } from 'next/server';
import { IdentityProviderService } from '@/lib/identity-providers';
import { AuthService } from '@/lib/auth-service';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/login?error=missing_params', request.url));
    }

    const provider = await IdentityProviderService.getProvider('google');
    if (!provider) {
      return NextResponse.redirect(new URL('/login?error=provider_not_found', request.url));
    }

    // Exchange code for tokens
    const tokens = await IdentityProviderService.exchangeCodeForToken(provider, code);
    if (!tokens.access_token) {
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url));
    }

    // Get user profile
    const profile = await IdentityProviderService.getUserProfile(provider, tokens.access_token);
    
    // Parse state
    let stateData;
    try {
      stateData = JSON.parse(atob(state));

    } catch {
      return NextResponse.redirect(new URL('/login?error=invalid_state', request.url));
    }

    // Check if user exists
    const existingUser = await IdentityProviderService.findUserBySocialAccount(provider.id, profile.id);
    
    if (existingUser) {
      // Login existing user
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
      
      const response = NextResponse.redirect(new URL(redirectUrl, request.url));
      response.cookies.set('session_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      });
      
      return response;
    } else {
      // New user - redirect to complete signup
      const signupData = {
        provider: 'google',
        profile,
        tokens,
        mode: stateData.mode
      };
      
      // Store temporary data in session
      const tempToken = btoa(JSON.stringify(signupData));
      const response = NextResponse.redirect(new URL(`/signup?social=${tempToken}`, request.url));
      
      return response;
    }
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(new URL('/login?error=callback_failed', request.url));
  }
}