import { PrismaClient } from '@prisma/client';
import { ensureDbInitialized } from './db-init';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
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