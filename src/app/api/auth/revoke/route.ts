import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '@/lib/oauth';
import { AuditService } from '@/lib/audit';

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

export async function POST(request: NextRequest) {
  const ipAddress = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  try {
    const formData = await request.formData();
    
    const token = formData.get('token') as string;
    const token_type_hint = formData.get('token_type_hint') as string;
    const client_id = formData.get('client_id') as string;
    const client_secret = formData.get('client_secret') as string;
    
    if (!token || !client_id || !client_secret) {
      return NextResponse.json({ 
        error: 'invalid_request',
        error_description: 'Missing required parameters'
      }, { status: 400 });
    }
    
    // Validate client
    const client = await OAuthService.validateClient(client_id, client_secret);
    if (!client) {
      return NextResponse.json({ 
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      }, { status: 401 });
    }
    
    // Get user ID from token before revoking
    let userId: string | null = null;
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      userId = decoded.sub || decoded.userId;
    } catch (error) {
      // Token might be invalid, continue with revocation anyway
    }

    // Revoke token (try both types if hint not provided)
    if (!token_type_hint || token_type_hint === 'access_token') {
      await OAuthService.revokeToken(token, 'access_token');
    }
    if (!token_type_hint || token_type_hint === 'refresh_token') {
      await OAuthService.revokeToken(token, 'refresh_token');
    }

    // IMPORTANT: Also revoke all user sessions to force re-authentication
    if (userId) {
      const { prisma } = require('@/lib/prisma');
      
      // Marquer l'utilisateur comme nécessitant une réauthentification
      await prisma.user.update({
        where: { id: userId },
        data: {
          profile: {
            update: {
              metadata: {
                ...{}, // Garder les métadonnées existantes
                requireReauth: true,
                revokedAt: new Date().toISOString()
              }
            }
          }
        }
      });
      
      // Expirer toutes les sessions
      await prisma.userSession.updateMany({
        where: { userId },
        data: { 
          expiresAt: new Date() // Expire all sessions immediately
        }
      });
      
      console.log(`🔒 Revoked all sessions for user ${userId} due to OAuth token revocation`);
    }
    
    await AuditService.log({
      action: 'oauth_token_revoked',
      resourceType: 'oauth',
      newValues: { client_id, token_type_hint },
      ipAddress,
      userAgent
    });
    
    return new Response(null, { status: 200 });
    
  } catch (error: any) {
    console.error('Token revocation error:', error);
    
    await AuditService.log({
      action: 'oauth_revoke_error',
      resourceType: 'oauth',
      newValues: { error: error.message },
      ipAddress,
      userAgent
    });
    
    return NextResponse.json({ 
      error: 'server_error',
      error_description: 'Internal server error'
    }, { status: 500 });
  }
}