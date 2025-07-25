import { prisma } from './prisma';

export interface AuditLogData {
  userId?: string;
  adminId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  static async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId || null,
          adminId: data.adminId || null,
          action: data.action,
          resourceType: data.resourceType,
          resourceId: data.resourceId || null,
          oldValues: data.oldValues || null,
          newValues: data.newValues || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null
        }
      });
    } catch (error) {
      console.error('Audit log failed:', error);
      // Ne pas faire échouer l'opération principale
    }
  }
  
  static async logUserAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: { oldValues?: any; newValues?: any; ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resourceType,
      resourceId,
      oldValues: details?.oldValues,
      newValues: details?.newValues,
      ipAddress: details?.ipAddress,
      userAgent: details?.userAgent
    });
  }
  
  static async logAdminAction(
    adminId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: { oldValues?: any; newValues?: any; ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      adminId,
      action,
      resourceType,
      resourceId,
      oldValues: details?.oldValues,
      newValues: details?.newValues,
      ipAddress: details?.ipAddress,
      userAgent: details?.userAgent
    });
  }
  
  static async getAuditLogs(filters?: {
    userId?: string;
    adminId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.adminId) where.adminId = filters.adminId;
    if (filters?.action) where.action = { contains: filters.action };
    if (filters?.resourceType) where.resourceType = filters.resourceType;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }
    
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { email: true, userType: true } },
          admin: { select: { username: true, fullName: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ]);
    
    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}