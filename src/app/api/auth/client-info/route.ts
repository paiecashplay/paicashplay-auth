import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    
    if (!clientId) {
      return NextResponse.json({ 
        error: 'Client ID is required' 
      }, { status: 400 });
    }
    
    const client = await prisma.oAuthClient.findUnique({
      where: { clientId },
      select: {
        name: true,
        description: true
      }
    });
    
    if (!client) {
      return NextResponse.json({ 
        error: 'Client not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      client
    });
    
  } catch (error: any) {
    console.error('Client info error:', error);
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}