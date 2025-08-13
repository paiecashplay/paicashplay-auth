import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/admin-service';
import { AdminAuthService } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const admin = await AdminAuthService.validateAdminSession(sessionToken);
    if (!admin) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

    const stats = await AdminService.getStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}