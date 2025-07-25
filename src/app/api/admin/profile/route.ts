import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const GET = requireAdmin(async (request: NextRequest, admin: any) => {
  try {
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: admin.id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    return NextResponse.json({ admin: adminUser });
  } catch (error) {
    console.error('Admin profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const PUT = requireAdmin(async (request: NextRequest, admin: any) => {
  try {
    const body = await request.json();
    const { username, email, fullName, currentPassword, newPassword } = body;

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ 
          error: 'Current password required to change password' 
        }, { status: 400 });
      }

      const adminUser = await prisma.adminUser.findUnique({
        where: { id: admin.id }
      });

      if (!adminUser || !await bcrypt.compare(currentPassword, adminUser.passwordHash)) {
        return NextResponse.json({ 
          error: 'Current password is incorrect' 
        }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          username,
          email,
          fullName,
          passwordHash
        }
      });
    } else {
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          username,
          email,
          fullName
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});