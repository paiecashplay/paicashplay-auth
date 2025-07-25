import { hashPassword, verifyPassword, generateSecureToken } from './password';
import { prisma } from './prisma';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  lastLogin?: Date;
}

export class AdminAuthService {
  static async loginAdmin(username: string, password: string, ipAddress?: string, userAgent?: string) {
    const admin = await prisma.adminUser.findFirst({
      where: { username, isActive: true }
    });

    if (!admin) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await verifyPassword(password, admin.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() }
    });
    
    // Log login
    await this.logAction(admin.id, 'admin_login', 'session', null, { ipAddress, userAgent });
    
    // Create session
    const sessionToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await prisma.userSession.create({
      data: {
        userId: admin.id,
        sessionToken,
        ipAddress,
        userAgent,
        expiresAt
      }
    });
    
    return {
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        isActive: admin.isActive
      },
      sessionToken
    };
  }
  
  static async validateAdminSession(sessionToken: string): Promise<AdminUser | null> {
    const session = await prisma.userSession.findFirst({
      where: { 
        sessionToken,
        expiresAt: { gt: new Date() }
      }
    });
    
    if (!session) return null;
    
    const admin = await prisma.adminUser.findFirst({
      where: { id: session.userId, isActive: true }
    });
    
    if (!admin) return null;
    
    return {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      fullName: admin.fullName,
      isActive: admin.isActive,
      lastLogin: admin.lastLogin
    };
  }
  
  static async createAdmin(data: { username: string; password: string; email: string; fullName: string }) {
    const { username, password, email, fullName } = data;
    
    // Check if admin exists
    const existing = await prisma.adminUser.findFirst({
      where: { 
        OR: [
          { username },
          { email }
        ]
      }
    });
    
    if (existing) {
      throw new Error('Admin already exists');
    }
    
    const passwordHash = await hashPassword(password);
    
    const admin = await prisma.adminUser.create({
      data: {
        username,
        passwordHash,
        email,
        fullName
      }
    });
    
    return admin.id;
  }
  
  static async logAction(
    adminId: string, 
    action: string, 
    resourceType: string, 
    resourceId?: string | null, 
    details?: any
  ) {
    await prisma.adminLog.create({
      data: {
        adminId,
        action,
        resourceType,
        resourceId,
        details: details || {},
        ipAddress: details?.ipAddress,
        userAgent: details?.userAgent
      }
    });
  }
  
  static async getAdminLogs(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        include: {
          admin: {
            select: {
              username: true,
              fullName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.adminLog.count()
    ]);
    
    return {
      logs: logs.map(log => ({
        ...log,
        username: log.admin.username,
        full_name: log.admin.fullName
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }
}