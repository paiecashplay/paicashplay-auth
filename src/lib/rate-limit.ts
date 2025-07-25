import { prisma } from './prisma';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const defaultConfigs: Record<string, RateLimitConfig> = {
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 tentatives par 15min
  signup: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 inscriptions par heure
  reset_password: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  oauth_token: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 tokens par minute
  api_general: { windowMs: 60 * 1000, maxRequests: 100 }
};

export class RateLimitService {
  static async checkRateLimit(
    key: string, 
    type: keyof typeof defaultConfigs = 'api_general'
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const config = defaultConfigs[type];
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);
    
    // Nettoyer les anciens enregistrements
    await prisma.rateLimitLog.deleteMany({
      where: { expiresAt: { lt: now } }
    });
    
    // Vérifier le taux actuel
    const existing = await prisma.rateLimitLog.findUnique({
      where: { key }
    });
    
    if (!existing) {
      // Première requête dans la fenêtre
      await prisma.rateLimitLog.create({
        data: {
          key,
          count: 1,
          expiresAt: new Date(now.getTime() + config.windowMs)
        }
      });
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: new Date(now.getTime() + config.windowMs)
      };
    }
    
    if (existing.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: existing.expiresAt
      };
    }
    
    // Incrémenter le compteur
    await prisma.rateLimitLog.update({
      where: { key },
      data: { count: { increment: 1 } }
    });
    
    return {
      allowed: true,
      remaining: config.maxRequests - existing.count - 1,
      resetTime: existing.expiresAt
    };
  }
  
  static async resetRateLimit(key: string): Promise<void> {
    await prisma.rateLimitLog.delete({
      where: { key }
    }).catch(() => {}); // Ignore si n'existe pas
  }
  
  static generateKey(identifier: string, type: string): string {
    return `${type}:${identifier}`;
  }
}