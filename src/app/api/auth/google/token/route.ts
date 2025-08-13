import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ 
        error: 'Authorization code required' 
      }, { status: 400 });
    }

    // Récupérer la configuration Google
    const googleProvider = await prisma.identityProvider.findFirst({
      where: { name: 'google', isEnabled: true }
    });

    if (!googleProvider) {
      return NextResponse.json({ 
        error: 'Google provider not configured' 
      }, { status: 500 });
    }

    // Échanger le code contre un access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: googleProvider.clientId,
        client_secret: googleProvider.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/auth/google/callback`
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return NextResponse.json({ 
        error: tokenData.error_description || 'Failed to exchange code for token' 
      }, { status: 400 });
    }

    return NextResponse.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in
    });

  } catch (error) {
    console.error('Google token exchange error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}