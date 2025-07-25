import { prisma, ensurePrismaReady } from './prisma';

// Ensure database is ready on first import
ensurePrismaReady();

export default prisma;