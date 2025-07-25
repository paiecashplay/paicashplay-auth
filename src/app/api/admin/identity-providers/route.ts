import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import { IdentityProviderService } from '@/lib/identity-providers';

export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    const providers = await IdentityProviderService.getEnabledProviders();
    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Error fetching identity providers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, displayName, type, clientId, clientSecret, config } = body;

    if (!name || !displayName || !type || !clientId || !clientSecret) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    const provider = await IdentityProviderService.createProvider({
      name,
      displayName,
      type,
      clientId,
      clientSecret,
      config
    });

    return NextResponse.json({ provider });
  } catch (error) {
    console.error('Error creating identity provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});