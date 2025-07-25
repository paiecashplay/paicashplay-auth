import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      userType: user.userType,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified
    }
  });
});