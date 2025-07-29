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
    
    // Test SMTP connection first
    const connectionTest = await EmailService.testSmtpConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json({ 
        error: `Connexion SMTP échouée: ${connectionTest.message}`,
        code: connectionTest.code
      }, { status: 500 });
    }
    
    // Send test email
    await EmailService.sendWelcomeEmail(
      testEmail || admin.email,
      'Test',
      'Utilisateur',
      'player' as any
    );
    
    // Log the action
    await AdminAuthService.logAction(admin.id, 'smtp_test', 'config', null, { testEmail });
    
    return NextResponse.json({ success: true, message: 'Test email sent successfully' });
    
  } catch (error: any) {
    if (error.message.includes('Authentication') || error.message.includes('session')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    console.error('SMTP test error:', error);
    
    // Gestion spécifique des erreurs de timeout
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      return NextResponse.json({ 
        error: 'Timeout de connexion SMTP. Vérifiez l\'hôte et le port.',
        code: 'TIMEOUT'
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'SMTP test failed',
      code: error.code
    }, { status: 500 });
  }
}