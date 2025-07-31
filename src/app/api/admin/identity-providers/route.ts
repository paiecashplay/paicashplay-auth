import { NextRequest, NextResponse } from 'next/server';
import { IdentityProviderService } from '@/lib/identity-providers';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { AdminAuthService } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const admin = await AdminAuthService.validateAdminSession(sessionToken);
    if (!admin) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

    const providers = await prisma.identityProvider.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Error fetching identity providers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const admin = await AdminAuthService.validateAdminSession(sessionToken);
    if (!admin) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

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
}