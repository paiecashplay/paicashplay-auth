import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/admin-service';
import { requireAdmin } from '@/lib/middleware';

// Get OAuth clients
export const GET = requireAdmin(async (request: NextRequest, admin: any) => {
  try {
    const clients = await AdminService.getOAuthClients();
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// Create OAuth client
export const POST = requireAdmin(async (request: NextRequest, admin: any) => {
  try {
    const body = await request.json();
    const { name, description, redirectUris, allowedScopes = ['openid', 'profile', 'email'] } = body;
    
    if (!name || !redirectUris || !Array.isArray(redirectUris) || redirectUris.length === 0) {
      return NextResponse.json({ 
        error: 'Name and redirect URIs are required' 
      }, { status: 400 });
    }
    
    // Validate scopes
    const validScopes = [
      'openid', 'profile', 'email',
      'users:read', 'users:write',
      'clubs:read', 'clubs:write', 'clubs:members',
      'players:read', 'players:write',
      'federations:read'
    ];
    
    const invalidScopes = allowedScopes.filter((scope: string) => !validScopes.includes(scope));
    if (invalidScopes.length > 0) {
      return NextResponse.json({ 
        error: `Invalid scopes: ${invalidScopes.join(', ')}` 
      }, { status: 400 });
    }
    
    // Validate redirect URIs
    for (const uri of redirectUris) {
      try {
        new URL(uri);
      } catch {
        return NextResponse.json({ 
          error: `Invalid redirect URI: ${uri}` 
        }, { status: 400 });
      }
    }
    
    const { clientId, clientSecret } = await AdminService.createOAuthClient({
      name,
      description,
      redirectUris,
      allowedScopes
    });
    
    return NextResponse.json({
      success: true,
      client: { clientId, clientSecret }
    });
    
  } catch (error) {
    console.error('Create client error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});