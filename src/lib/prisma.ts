import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

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