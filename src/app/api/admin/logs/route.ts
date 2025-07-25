import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/admin-auth';
import { requireAdmin } from '@/lib/middleware';

export const GET = requireAdmin(async (request: NextRequest, admin: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const result = await AdminAuthService.getAdminLogs(page, limit);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Get admin logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});