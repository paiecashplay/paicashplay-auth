import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export const PUT = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { firstName, lastName, phone, country, language } = body;
    
    if (!firstName || !lastName) {
      return NextResponse.json({ 
        error: 'First name and last name are required' 
      }, { status: 400 });
    }
    
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        firstName,
        lastName,
        phone: phone || null,
        country: country || null,
        language: language || 'fr'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
});