import { generateSecureToken } from './password';
import { prisma } from './prisma';

export interface CreateOAuthClientData {
  name: string;
  description?: string;
  redirectUris: string[];
  allowedScopes?: string[];
}

export class AdminService {
  static async createOAuthClient(clientData: CreateOAuthClientData) {
    const { name, description, redirectUris, allowedScopes = ['openid', 'profile', 'email'] } = clientData;
    
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = generateSecureToken();
    
    await prisma.oAuthClient.create({
      data: {
        clientId,
        clientSecret,
        name,
        description,
        redirectUris,
        allowedScopes
      }
    });
    
    return { clientId, clientSecret };
  }
  
  static async getOAuthClients() {
    const clients = await prisma.oAuthClient.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return clients.map(client => ({
      id: client.id,
      client_id: client.clientId,
      client_secret: client.clientSecret,
      name: client.name,
      description: client.description,
      redirect_uris: client.redirectUris as string[],
      allowed_scopes: client.allowedScopes as string[],
      is_active: client.isActive,
      created_at: client.createdAt
    }));
  }
  
  static async updateOAuthClientStatus(clientId: string, isActive: boolean) {
    await prisma.oAuthClient.update({
      where: { clientId },
      data: { isActive }
    });
  }
  
  static async getUsers(page = 1, limit = 50, userType?: string, search?: string) {
    const offset = (page - 1) * limit;
    
    const whereClause: any = {};
    if (userType) whereClause.userType = userType;
    if (search) {
      whereClause.OR = [
        { email: { contains: search } },
        { profile: { firstName: { contains: search } } },
        { profile: { lastName: { contains: search } } }
      ];
    }
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: { profile: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.user.count({ where: whereClause })
    ]);
    
    return {
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        user_type: user.userType,
        is_verified: user.isVerified,
        is_active: user.isActive,
        created_at: user.createdAt,
        first_name: user.profile?.firstName,
        last_name: user.profile?.lastName,
        phone: user.profile?.phone,
        country: user.profile?.country,
        metadata: user.profile?.metadata ? JSON.parse(JSON.stringify(user.profile.metadata)) : null
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  static async updateUserStatus(userId: string, isActive: boolean) {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive }
    });
  }
  
  static async verifyUserEmail(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true }
    });
  }
  
  static async resetUserPassword(userId: string) {
    const tempPassword = Math.random().toString(36).slice(-8);
    const { hashPassword } = await import('./password');
    const passwordHash = await hashPassword(tempPassword);
    
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });
    
    // Invalidate all sessions
    await prisma.userSession.deleteMany({
      where: { userId }
    });
    
    return tempPassword;
  }
  
  static async getStats() {
    const [totalUsers, verifiedUsers, activeSessions, userTypeStats] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isVerified: true, isActive: true } }),
      prisma.userSession.count({ where: { expiresAt: { gt: new Date() } } }),
      prisma.user.groupBy({
        by: ['userType'],
        where: { isActive: true },
        _count: { userType: true }
      })
    ]);
    
    return {
      totalUsers,
      verifiedUsers,
      activeSessions,
      userTypeStats: userTypeStats.map(stat => ({
        userType: stat.userType,
        count: stat._count.userType
      }))
    };
  }

  static async getSessionStats() {
    const [activeSessions, totalSessions, recentSessions] = await Promise.all([
      prisma.userSession.count({ where: { expiresAt: { gt: new Date() } } }),
      prisma.userSession.count(),
      prisma.userSession.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);

    return {
      activeSessions,
      totalSessions,
      recentSessions
    };
  }

  static async getRecentActivity() {
    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { profile: true }
    });

    return {
      recentUsers: recentUsers.map(user => {
        const metadata = user.profile?.metadata as any;
        const organizationName = metadata?.organizationName;
        const displayName = organizationName || 
          (user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : null);
        
        return {
          id: user.id,
          email: user.email,
          userType: user.userType,
          name: displayName,
          createdAt: user.createdAt
        };
      }),
      recentSessions: []
    };
  }
}