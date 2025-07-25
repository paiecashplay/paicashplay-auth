import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { EmailService } from '@/lib/email-service';
import db from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;
    
    if (!token) {
      return NextResponse.json({ 
        error: 'Verification token is required' 
      }, { status: 400 });
    }
    
    // Get user info before verification
    const [tokenRows] = await db.execute(`
      SELECT ev.user_id, u.email, p.first_name, u.user_type
      FROM email_verifications ev
      JOIN users u ON ev.user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE ev.token = ? AND ev.used = FALSE AND ev.expires_at > NOW()
    `, [token]);
    
    const tokenData = (tokenRows as any[])[0];
    if (!tokenData) {
      return NextResponse.json({ 
        error: 'Invalid or expired verification token' 
      }, { status: 400 });
    }
    
    // Verify email
    await AuthService.verifyEmail(token);
    
    // Send welcome email
    await EmailService.sendWelcomeEmail(
      tokenData.email, 
      tokenData.first_name, 
      tokenData.user_type
    );
    
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. Welcome to PaieCashPlay!'
    });
    
  } catch (error: any) {
    console.error('Email verification error:', error);
    
    if (error.message === 'Invalid or expired verification token') {
      return NextResponse.json({ 
        error: 'Invalid or expired verification token' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}