import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

// GET /api/admin/clients/[id] - Récupérer un client spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  // Apply admin middleware manually
  const adminCheck = requireAdmin(async (req: NextRequest, admin: any) => {
    try {
      const client = await prisma.oAuthClient.findUnique({
        where: { id: resolvedParams.id }
      });

      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }

      return NextResponse.json({
        client: {
          id: client.id,
          client_id: client.clientId,
          client_secret: client.clientSecret,
          name: client.name,
          description: client.description,
          redirect_uris: client.redirectUris as string[],
          allowed_scopes: client.allowedScopes as string[],
          is_active: client.isActive,
          created_at: client.createdAt.toISOString()
        }
      });
    } catch (error) {
      console.error('Get client error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
  
  return adminCheck(request);
}

// PUT /api/admin/clients/[id] - Modifier un client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const adminCheck = requireAdmin(async (req: NextRequest, admin: any) => {
    try {
      const { name, description, redirectUris, allowedScopes, isActive } = await req.json();
    
    // Validate scopes if provided
    if (allowedScopes) {
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
    }

      const client = await prisma.oAuthClient.update({
        where: { id: resolvedParams.id },
        data: {
          name,
          description,
          redirectUris,
          allowedScopes,
          isActive
        }
      });

      return NextResponse.json({ client });
    } catch (error) {
      console.error('Error updating client:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du client' },
        { status: 500 }
      );
    }
  });
  
  return adminCheck(request);
}

// DELETE /api/admin/clients/[id] - Supprimer un client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const adminCheck = requireAdmin(async (req: NextRequest, admin: any) => {
    try {
      await prisma.oAuthClient.delete({
        where: { id: resolvedParams.id }
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting client:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du client' },
        { status: 500 }
      );
    }
  });
  
  return adminCheck(request);
}