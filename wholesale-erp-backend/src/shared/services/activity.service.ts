import { ActivityAction, Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../../config/database';

interface LogActivityInput {
  userId: string;
  action: ActivityAction;
  entityType: string;
  entityId?: string;
  entityLabel?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logActivity(
  input: LogActivityInput,
  tx: Prisma.TransactionClient | PrismaClient = prisma
): Promise<void> {
  await tx.activityLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      entityLabel: input.entityLabel,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
      ipAddress: input.ipAddress,
    },
  });
}
