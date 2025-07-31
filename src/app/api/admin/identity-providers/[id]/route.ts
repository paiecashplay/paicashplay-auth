import { NextRequest, NextResponse } from 'next/server';
import { IdentityProviderService } from '@/lib/identity-providers';
import { cookies } from 'next/headers';
import { AdminAuthService } from '@/lib/admin-auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    
    const updatedProvider = await IdentityProviderService.updateProvider(id, body);
    
    return NextResponse.json({
      success: true,
      provider: updatedProvider,
      message: 'Provider mis à jour avec succès'
    });
  } catch (error) {
    console.error('Error updating identity provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}