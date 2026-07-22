import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../../config/database';

type NotificationType = 'info' | 'warning' | 'success' | 'error';

interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  actionUrl?: string;
}

export async function createNotification(
  input: CreateNotificationInput,
  tx: Prisma.TransactionClient | PrismaClient = prisma
): Promise<void> {
  await tx.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type ?? 'info',
      actionUrl: input.actionUrl,
    },
  });
}

export async function notifyRoles(
  roles: string[],
  payload: Omit<CreateNotificationInput, 'userId'>,
  tx: Prisma.TransactionClient | PrismaClient = prisma
): Promise<void> {
  const users = await tx.user.findMany({
    where: { role: { in: roles as never[] }, isActive: true },
    select: { id: true },
  });
  if (users.length === 0) return;
  await tx.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      title: payload.title,
      message: payload.message,
      type: payload.type ?? 'info',
      actionUrl: payload.actionUrl,
    })),
  });
}
