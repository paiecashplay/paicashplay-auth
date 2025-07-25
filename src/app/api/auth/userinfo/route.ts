import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import db from '@/lib/database';

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return NextResponse.json({ 
      error: 'invalid_token',
      error_description: 'Missing or invalid authorization header'
    }, { status: 401 });
  }
  
  const token = authorization.substring(7);
  
  try {
    // Verify JWT token
    const payload = await verifyToken(token);
    
    // Get user information from database
    const [userRows] = await db.execute(`
      SELECT u.id, u.email, u.user_type, u.is_verified, u.created_at,
             p.first_name, p.last_name, p.phone, p.country, p.language, p.avatar_url
      FROM users u 
      LEFT JOIN user_profiles p ON u.id = p.user_id 
      WHERE u.id = ? AND u.is_active = TRUE
    `, [payload.sub]);
    
    const user = (userRows as any[])[0];
    if (!user) {
      return NextResponse.json({ 
        error: 'invalid_token',
        error_description: 'User not found'
      }, { status: 401 });
    }
    
    // Return user info based on requested scopes
    const scopes = payload.scope?.split(' ') || [];
    const userInfo: any = {
      sub: user.id
    };
    
    if (scopes.includes('profile')) {
      userInfo.name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      userInfo.given_name = user.first_name;
      userInfo.family_name = user.last_name;
      userInfo.phone_number = user.phone;
      userInfo.locale = user.language;
      userInfo.picture = user.avatar_url;
      userInfo.user_type = user.user_type;
    }
    
    if (scopes.includes('email')) {
      userInfo.email = user.email;
      userInfo.email_verified = user.is_verified;
    }
    
    return NextResponse.json(userInfo);
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'invalid_token',
      error_description: 'Token verification failed'
    }, { status: 401 });
  }
}