import { prisma } from './prisma';
import crypto from 'crypto';

export interface SystemConfig {
  id: string;
  configKey: string;
  configValue: string;
  configType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  description?: string;
  isEncrypted: boolean;
}

export class ConfigService {
  private static encryptionKey = process.env.CONFIG_ENCRYPTION_KEY || 'default-key-change-in-production';
  
  static async getConfig(key: string): Promise<string | null> {
    const config = await prisma.systemConfig.findUnique({
      where: { configKey: key }
    });
    
    if (!config) return null;
    
    if (config.isEncrypted && config.configValue) {
      return this.decrypt(config.configValue);
    }
    
    return config.configValue;
  }
  
  static async setConfig(key: string, value: string, encrypt = false, adminId?: string) {
    const finalValue = encrypt ? this.encrypt(value) : value;
    
    await prisma.systemConfig.upsert({
      where: { configKey: key },
      update: {
        configValue: finalValue,
        isEncrypted: encrypt,
        updatedBy: adminId
      },
      create: {
        configKey: key,
        configValue: finalValue,
        isEncrypted: encrypt,
        updatedBy: adminId
      }
    });
  }
  
  static async getAllConfigs(): Promise<SystemConfig[]> {
    const configs = await prisma.systemConfig.findMany({
      orderBy: { configKey: 'asc' }
    });
    
    return configs.map(config => ({
      id: config.id,
      configKey: config.configKey,
      configValue: config.isEncrypted ? '***encrypted***' : (config.configValue || ''),
      configType: config.configType,
      description: config.description || undefined,
      isEncrypted: config.isEncrypted
    }));
  }
  
  static async updateConfig(key: string, value: string, adminId: string) {
    const sensitiveKeys = ['smtp_password', 'jwt_secret', 'db_password'];
    const shouldEncrypt = sensitiveKeys.includes(key);
    
    await this.setConfig(key, value, shouldEncrypt, adminId);
  }
  
  static async getSmtpConfig() {
    const configs = await Promise.all([
      this.getConfig('smtp_host'),
      this.getConfig('smtp_port'),
      this.getConfig('smtp_user'),
      this.getConfig('smtp_password'),
      this.getConfig('smtp_secure'),
      this.getConfig('from_email'),
      this.getConfig('from_name')
    ]);
    
    return {
      host: configs[0] || 'localhost',
      port: parseInt(configs[1] || '587'),
      user: configs[2] || '',
      password: configs[3] || '',
      secure: configs[4] === 'true',
      fromEmail: configs[5] || 'noreply@paiecashplay.com',
      fromName: configs[6] || 'PaieCashPlay'
    };
  }
  
  static async updateSmtpConfig(smtpData: any, adminId: string) {
    const updates = [
      ['smtp_host', smtpData.host],
      ['smtp_port', smtpData.port.toString()],
      ['smtp_user', smtpData.user],
      ['smtp_password', smtpData.password],
      ['smtp_secure', smtpData.secure.toString()],
      ['from_email', smtpData.fromEmail],
      ['from_name', smtpData.fromName]
    ];
    
    for (const [key, value] of updates) {
      await this.updateConfig(key, value, adminId);
    }
  }
  
  private static encrypt(text: string): string {
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }
  
  private static decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}