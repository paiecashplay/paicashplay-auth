import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/admin-service';
import { requireUserType } from '@/lib/middleware';

export const GET = requireUserType(['federation'])(async (request: NextRequest, user: any) => {
  try {
    const stats = await AdminService.getSessionStats();
    const recentActivity = await AdminService.getRecentActivity();
    
    return NextResponse.json({
      stats,
      recentActivity
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});