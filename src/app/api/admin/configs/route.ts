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
    
    const configs = await ConfigService.getAllConfigs();
    return NextResponse.json({ configs });
    
  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('session')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    console.error('Get configs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdminAuth(request);
    
    const body = await request.json();
    const { key, value } = body;
    
    if (!key || value === undefined) {
      return NextResponse.json({ 
        error: 'Key and value are required' 
      }, { status: 400 });
    }
    
    await ConfigService.updateConfig(key, value, admin.id);
    
    // Log the action
    await AdminAuthService.logAction(admin.id, 'config_update', 'config', key, { key, value });
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('session')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    console.error('Update config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}