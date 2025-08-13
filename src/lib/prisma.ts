import { PrismaClient } from '@prisma/client';
import { ensureDbInitialized } from './db-init';
import { getDatabaseUrl, validateDatabaseConfig } from './database-config';

// Valider la configuration au démarrage
if (!validateDatabaseConfig()) {
  throw new Error('Configuration de base de données manquante ou invalide');
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
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
    initPromise = ensureDbInitialized();
  }
  return initPromise;
}