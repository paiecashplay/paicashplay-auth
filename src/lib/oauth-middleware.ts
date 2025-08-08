import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface OAuthContext {
  user: any;
  client: any;
  scopes: string[];
}

export function requireOAuthScope(requiredScopes: string[]) {
  return function(handler: (request: NextRequest, context: OAuthContext) => Promise<NextResponse>) {
    return async (request: NextRequest) => {
      try {
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return NextResponse.json({ error: 'Bearer token required' }, { status: 401 });
        }
        
        const token = authHeader.substring(7);
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        // Find access token in database
        const accessToken = await prisma.accessToken.findFirst({
          where: {
            tokenHash,
            revoked: false,
            expiresAt: { gt: new Date() }
          },
          include: {
            user: { include: { profile: true } },
            client: true
          }
        });
        
        if (!accessToken) {
          return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }
        
        // Verify JWT signature
        try {
          jwt.verify(token, process.env.JWT_SECRET!);
        } catch (error) {
          return NextResponse.json({ error: 'Invalid token signature' }, { status: 401 });
        }
        
        const tokenScopes = (accessToken.scope || '').split(' ');
        
        // Check if token has required scopes
        const hasRequiredScopes = requiredScopes.every(scope => tokenScopes.includes(scope));
        
        console.log('🔍 OAuth Scope Check:', {
          endpoint: request.url,
          required: requiredScopes,
          token_scopes: tokenScopes,
          client_id: accessToken.client.clientId,
          user_id: accessToken.user.id,
          has_required: hasRequiredScopes
        });
        
        if (!hasRequiredScopes) {
          console.log('❌ Insufficient scope for', request.url);
          return NextResponse.json({ 
            error: 'Insufficient scope',
            required_scopes: requiredScopes,
            token_scopes: tokenScopes,
            client_id: accessToken.client.clientId
          }, { status: 403 });
        }
        
        const context: OAuthContext = {
          user: accessToken.user,
          client: accessToken.client,
          scopes: tokenScopes
        };
        
        return handler(request, context);
        
      } catch (error) {
        console.error('OAuth middleware error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    };
  };
}