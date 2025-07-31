import { NextRequest, NextResponse } from 'next/server';
import { generateSecureToken } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { client_id, redirect_uri, scope, state, approved } = body;
    
    if (!client_id || !redirect_uri) {
      return NextResponse.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }
    
    // Get user from session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }
    
    let userId: string;
    try {
      const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid session' 
      }, { status: 401 });
    }
    
    // Verify client and redirect URI
    const client = await prisma.oAuthClient.findUnique({
      where: { clientId: client_id }
    });
    
    if (!client) {
      return NextResponse.json({ 
        error: 'Invalid client' 
      }, { status: 400 });
    }
    
    const redirectUris = client.redirectUris as string[];
    if (!redirectUris.includes(redirect_uri)) {
      return NextResponse.json({ 
        error: 'Invalid redirect URI' 
      }, { status: 400 });
    }
    
    const redirectUrl = new URL(redirect_uri);
    
    if (!approved) {
      // User denied access
      redirectUrl.searchParams.set('error', 'access_denied');
      if (state) redirectUrl.searchParams.set('state', state);
      
      return NextResponse.json({
        success: true,
        redirectUrl: redirectUrl.toString()
      });
    }
    
    // Generate authorization code
    const authCode = generateSecureToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store authorization code
    await prisma.authorizationCode.create({
      data: {
        code: authCode,
        clientId: client.id,
        userId,
        redirectUri: redirect_uri,
        scope: scope || 'openid',
        expiresAt
      }
    });
    
    // Note: User consent is tracked via authorization codes for now
    // Future enhancement: Add UserConsent model for persistent consent tracking
    
    // Redirect with authorization code
    redirectUrl.searchParams.set('code', authCode);
    if (state) redirectUrl.searchParams.set('state', state);
    
    return NextResponse.json({
      success: true,
      redirectUrl: redirectUrl.toString()
    });
    
  } catch (error: any) {
    console.error('Consent error:', error);
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}