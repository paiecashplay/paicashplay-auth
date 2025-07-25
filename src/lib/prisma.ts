import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Cloud SQL connection configuration
const getDatabaseUrl = () => {
  if (process.env.NODE_ENV === 'production' && process.env.CLOUD_SQL_CONNECTION_NAME) {
    // Cloud Run with Cloud SQL
    return `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@localhost/${process.env.DB_NAME}?socket=/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`;
  }
  
  // Local development or standard connection
  return process.env.DATABASE_URL || `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl()
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Auto-initialize on first use
let initPromise: Promise<void> | null = null;

export async function ensurePrismaReady() {
  if (!initPromise) {
    initPromise = (async () => {
      const { ensureDbInitialized } = await import('./db-init');
      await ensureDbInitialized();
    })();
  }
  return initPromise;
}