import { prisma } from './prisma';
import { generateSecureToken } from './password';

export interface ServiceConfig {
  name: string;
  url: string;
  adminPath: string;
  requiresAuth: boolean;
}

export const AVAILABLE_SERVICES: Record<string, ServiceConfig> = {
  'paiecash-main': {
    name: 'PaieCash Principal',
    url: 'https://paiecashplay.com',
    adminPath: '/admin',
    requiresAuth: true
  },
  'paiecash-api': {
    name: 'API PaieCash',
    url: 'https://api.paiecashplay.com',
    adminPath: '/admin',
    requiresAuth: true
  },
  'paiecash-analytics': {
    name: 'Analytics',
    url: 'https://analytics.paiecashplay.com',
    adminPath: '/admin',
    requiresAuth: true
  }
};

export class ServiceAdminService {
  static async generateServiceToken(adminId: string, serviceKey: string): Promise<string> {
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId }
    });

    if (!admin || !admin.isActive) {
      throw new Error('Admin not found or inactive');
    }

    // Check if admin has access to this service
    const allowedServices = admin.services as string[] || [];
    if (admin.role !== 'SUPER_ADMIN' && !allowedServices.includes(serviceKey)) {
      throw new Error('Access denied to this service');
    }

    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token for validation
    await prisma.systemConfig.upsert({
      where: { configKey: `service_token_${token}` },
      update: {
        configValue: JSON.stringify({
          adminId,
          serviceKey,
          expiresAt: expiresAt.toISOString()
        }),
        updatedAt: new Date()
      },
      create: {
        configKey: `service_token_${token}`,
        configValue: JSON.stringify({
          adminId,
          serviceKey,
          expiresAt: expiresAt.toISOString()
        }),
        configType: 'JSON',
        description: 'Service admin token'
      }
    });

    return token;
  }

  static async validateServiceToken(token: string): Promise<{ adminId: string; serviceKey: string } | null> {
    const config = await prisma.systemConfig.findUnique({
      where: { configKey: `service_token_${token}` }
    });

    if (!config || !config.configValue) return null;

    try {
      const data = JSON.parse(config.configValue);
      const expiresAt = new Date(data.expiresAt);
      
      if (expiresAt < new Date()) {
        // Token expired, clean up
        await prisma.systemConfig.delete({
          where: { configKey: `service_token_${token}` }
        });
        return null;
      }

      return { adminId: data.adminId, serviceKey: data.serviceKey };
    } catch {
      return null;
    }
  }

  static getServiceRedirectUrl(serviceKey: string, token: string): string {
    const service = AVAILABLE_SERVICES[serviceKey];
    if (!service) throw new Error('Service not found');

    return `${service.url}${service.adminPath}?auth_token=${token}`;
  }
}