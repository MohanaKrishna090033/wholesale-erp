import { PrismaClient } from '@prisma/client';
import { isDevelopment } from './env';
import { logger } from '../shared/utils/logger';

declare global {
  var __prisma__: PrismaClient | undefined;
}

export const prisma = global.__prisma__ ?? new PrismaClient({
  log: isDevelopment ? ['warn', 'error'] : ['error'],
});

if (isDevelopment) {
  global.__prisma__ = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to database');
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
