import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface OAuthContext {
  user: any;
  client: any;
  scopes: string[];
}

export async function validateOAuthToken(request: NextRequest, requiredScopes: string[] = []) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Bearer token required', status: 401 };
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
      return { valid: false, error: 'Invalid or expired token', status: 401 };
    }
    
    // Verify JWT signature
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return { 
          valid: false, 
          error: 'token_expired', 
          status: 401 
        };
      }
      return { valid: false, error: 'Invalid token signature', status: 401 };
    }
    
    const tokenScopes = (accessToken.scope || '').split(' ').filter(s => s);
    
    // Check if token has required scopes
    if (requiredScopes.length > 0) {
      const hasRequiredScopes = requiredScopes.every(scope => tokenScopes.includes(scope));
      
      if (!hasRequiredScopes) {
        return { 
          valid: false, 
          error: 'Insufficient scope', 
          status: 403,
          details: {
            required_scopes: requiredScopes,
            token_scopes: tokenScopes
          }
        };
      }
    }
    
    return {
      valid: true,
      user: accessToken.user,
      client: accessToken.client,
      scopes: tokenScopes
    };
    
  } catch (error) {
    console.error('OAuth token validation error:', error);
    return { valid: false, error: 'Internal server error', status: 500 };
  }
}

export function requireOAuthScope(requiredScopes: string[]) {
  return function(handler: (request: NextRequest, context: OAuthContext, routeParams?: any) => Promise<NextResponse>) {
    return async (request: NextRequest, routeParams?: any) => {
      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
          },
        });
      }
      
      // Await params if it's a Promise
      const resolvedParams = routeParams && typeof routeParams.params?.then === 'function' 
        ? { params: await routeParams.params } 
        : routeParams;
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
        } catch (error: any) {
          if (error.name === 'TokenExpiredError') {
            return NextResponse.json({ 
              error: 'token_expired',
              error_description: 'The access token has expired. Please refresh your token.' 
            }, { status: 401 });
          }
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
        
        const response = await handler(request, context, resolvedParams);
        
        // Add CORS headers to response
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
        
        return response;
        
      } catch (error) {
        console.error('OAuth middleware error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    };
  };
}