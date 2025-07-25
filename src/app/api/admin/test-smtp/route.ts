import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/admin-auth';
import { EmailService } from '@/lib/email-service';
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

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminAuth(request);
    
    const body = await request.json();
    const { testEmail } = body;
    
    // Send test email
    await EmailService.sendWelcomeEmail(
      testEmail || admin.email,
      'Test',
      'Test SMTP Configuration'
    );
    
    // Log the action
    await AdminAuthService.logAction(admin.id, 'smtp_test', 'config', null, { testEmail });
    
    return NextResponse.json({ success: true, message: 'Test email sent successfully' });
    
  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('session')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    console.error('SMTP test error:', error);
    return NextResponse.json({ error: error.message || 'SMTP test failed' }, { status: 500 });
  }
}