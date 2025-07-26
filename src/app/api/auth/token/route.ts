import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '@/lib/oauth';
import { RateLimitService } from '@/lib/rate-limit';
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
    // Rate limiting
    const rateLimitKey = RateLimitService.generateKey(ipAddress, 'oauth_token');
    const rateLimit = await RateLimitService.checkRateLimit(rateLimitKey, 'oauth_token');
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: 'too_many_requests',
        error_description: 'Rate limit exceeded'
      }, { status: 429 });
    }
    
    const formData = await request.formData();
    
    const grant_type = formData.get('grant_type') as string;
    const client_id = formData.get('client_id') as string;
    const client_secret = formData.get('client_secret') as string;
    
    // Validate client first
    const client = await OAuthService.validateClient(client_id, client_secret);
    if (!client) {
      await AuditService.log({
        action: 'oauth_invalid_client',
        resourceType: 'oauth',
        newValues: { client_id },
        ipAddress,
        userAgent
      });
      return NextResponse.json({ 
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      }, { status: 401 });
    }
    
    if (grant_type === 'authorization_code') {
      const code = formData.get('code') as string;
      const redirect_uri = formData.get('redirect_uri') as string;
      const code_verifier = formData.get('code_verifier') as string;
      
      if (!code || !redirect_uri) {
        return NextResponse.json({ 
          error: 'invalid_request',
          error_description: 'Missing required parameters'
        }, { status: 400 });
      }
      
      const tokens = await OAuthService.exchangeCodeForTokens(code, client_id, redirect_uri, code_verifier);
      if (!tokens) {
        await AuditService.log({
          action: 'oauth_invalid_code',
          resourceType: 'oauth',
          newValues: { client_id, code: code.substring(0, 8) + '...' },
          ipAddress,
          userAgent
        });
        return NextResponse.json({ 
          error: 'invalid_grant',
          error_description: 'Invalid or expired authorization code'
        }, { status: 400 });
      }
      
      await AuditService.log({
        action: 'oauth_token_issued',
        resourceType: 'oauth',
        newValues: { client_id, grant_type },
        ipAddress,
        userAgent
      });
      
      return NextResponse.json(tokens);
      
    } else if (grant_type === 'refresh_token') {
      const refresh_token = formData.get('refresh_token') as string;
      
      if (!refresh_token) {
        return NextResponse.json({ 
          error: 'invalid_request',
          error_description: 'Missing refresh_token parameter'
        }, { status: 400 });
      }
      
      const tokens = await OAuthService.refreshAccessToken(refresh_token, client_id);
      if (!tokens) {
        await AuditService.log({
          action: 'oauth_invalid_refresh_token',
          resourceType: 'oauth',
          newValues: { client_id },
          ipAddress,
          userAgent
        });
        return NextResponse.json({ 
          error: 'invalid_grant',
          error_description: 'Invalid or expired refresh token'
        }, { status: 400 });
      }
      
      await AuditService.log({
        action: 'oauth_token_refreshed',
        resourceType: 'oauth',
        newValues: { client_id },
        ipAddress,
        userAgent
      });
      
      return NextResponse.json(tokens);
      
    } else {
      return NextResponse.json({ 
        error: 'unsupported_grant_type',
        error_description: 'Supported grant types: authorization_code, refresh_token'
      }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('OAuth token error:', error);
    
    await AuditService.log({
      action: 'oauth_token_error',
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