import { NextRequest, NextResponse } from 'next/server';
import { IdentityProviderService } from '@/lib/identity-providers';

export async function GET(request: NextRequest) {
  try {
    const providers = await IdentityProviderService.getEnabledProviders();
    
    return NextResponse.json({
      providers: providers.map(p => ({
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        type: p.type
      }))
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}