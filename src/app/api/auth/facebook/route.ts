import { NextRequest, NextResponse } from 'next/server';
import { IdentityProviderService } from '@/lib/identity-providers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    
    const provider = await IdentityProviderService.getProvider('facebook');
    if (!provider || !provider.isEnabled) {
      return NextResponse.json({ error: 'Provider not available' }, { status: 404 });
    }

    const authUrl = IdentityProviderService.getAuthUrl(provider, state || '');
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Facebook auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}