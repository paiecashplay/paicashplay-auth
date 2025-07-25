import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '@/lib/oauth';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  
  const grant_type = formData.get('grant_type') as string;
  const code = formData.get('code') as string;
  const redirect_uri = formData.get('redirect_uri') as string;
  const client_id = formData.get('client_id') as string;
  const client_secret = formData.get('client_secret') as string;
  
  // Validate grant type
  if (grant_type !== 'authorization_code') {
    return NextResponse.json({ 
      error: 'unsupported_grant_type',
      error_description: 'Only authorization_code grant type is supported'
    }, { status: 400 });
  }
  
  // Validate required parameters
  if (!code || !redirect_uri || !client_id || !client_secret) {
    return NextResponse.json({ 
      error: 'invalid_request',
      error_description: 'Missing required parameters'
    }, { status: 400 });
  }
  
  // Validate client credentials
  const client = await OAuthService.validateClient(client_id, client_secret);
  if (!client) {
    return NextResponse.json({ 
      error: 'invalid_client',
      error_description: 'Invalid client credentials'
    }, { status: 401 });
  }
  
  // Exchange code for tokens
  const tokens = await OAuthService.exchangeCodeForTokens(code, client_id, redirect_uri);
  if (!tokens) {
    return NextResponse.json({ 
      error: 'invalid_grant',
      error_description: 'Invalid or expired authorization code'
    }, { status: 400 });
  }
  
  return NextResponse.json(tokens);
}