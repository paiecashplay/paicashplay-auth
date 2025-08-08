import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description, redirectUris, isActive } = await request.json();

    const client = await prisma.oAuthClient.update({
      where: { id: params.id },
      data: {
        name,
        description,
        redirectUris,
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
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.oAuthClient.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du client' },
      { status: 500 }
    );
  }
}