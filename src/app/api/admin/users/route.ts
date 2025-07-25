import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/admin-service';
import { requireAdmin } from '@/lib/middleware';

export const GET = requireAdmin(async (request: NextRequest, admin: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userType = searchParams.get('userType') || undefined;
    
    const result = await AdminService.getUsers(page, limit, userType);
    
    // Ensure pagination object exists
    if (!result.pagination) {
      result.pagination = {
        page: 1,
        limit: 50,
        total: result.users?.length || 0,
        totalPages: 1
      };
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});