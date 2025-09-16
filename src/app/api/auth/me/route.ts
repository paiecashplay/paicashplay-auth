import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  console.log('🔍 [ME ENDPOINT] User from middleware:', {
    id: user.id,
    email: user.email,
    profileAvatarUrl: user.profile?.avatarUrl
  });
  
  // Double vérification : récupérer directement depuis la base de données
  const freshUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { profile: true }
  });
  
  
  
  const responseData = {
    user: {
      id: user.id,
      email: user.email,
      userType: user.userType,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified,
      isActive: true,
      createdAt: new Date().toISOString(),
      profile: freshUser?.profile || user.profile
    }
  };
  console.log("response Data ",responseData)
  console.log('📤 [ME ENDPOINT] Response data:', {
    profileAvatarUrl: responseData.user.profile?.avatarUrl
  });
  
  return NextResponse.json(responseData);
});