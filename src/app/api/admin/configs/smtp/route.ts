import { NextRequest, NextResponse } from 'next/server';
import { ConfigService } from '@/lib/config-service';
import { AdminAuthService } from '@/lib/admin-auth';
import { cookies } from 'next/headers';

async function requireAdminAuth(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_session')?.value;
  
  if (!sessionToken) {
    throw new Error('Authentication required');
  }
  
  const admin = await AdminAuthService.validateAdminSession(sessionToken);
  if (!admin) {
    throw new Error('Invalid session');
  }
  
  return admin;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth(request);
    
    const smtp = await ConfigService.getSmtpConfig();
    return NextResponse.json({ smtp });
    
  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('session')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    console.error('Get SMTP config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdminAuth(request);
    
    const body = await request.json();
    await ConfigService.updateSmtpConfig(body, admin.id);
    
    // Log the action
    await AdminAuthService.logAction(admin.id, 'smtp_config_update', 'config', null, body);
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('session')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    console.error('Update SMTP config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}