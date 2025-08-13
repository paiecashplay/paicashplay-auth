import { NextRequest, NextResponse } from 'next/server';
import { ServiceAdminService, AVAILABLE_SERVICES } from '@/lib/service-admin';
import { AdminAuthService } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const { serviceKey } = await request.json();
    
    if (!serviceKey || !AVAILABLE_SERVICES[serviceKey]) {
      return NextResponse.json({ error: 'Service invalide' }, { status: 400 });
    }

    // Get admin session
    const sessionToken = request.cookies.get('admin_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const admin = await AdminAuthService.validateAdminSession(sessionToken);
    if (!admin) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

    // Generate service token
    const token = await ServiceAdminService.generateServiceToken(admin.id, serviceKey);
    const redirectUrl = ServiceAdminService.getServiceRedirectUrl(serviceKey, token);

    return NextResponse.json({ redirectUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}