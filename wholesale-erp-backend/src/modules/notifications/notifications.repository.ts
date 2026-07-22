import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

export const notificationsRepository = {
  async findMany(userId: string, skip: number, take: number, unreadOnly?: boolean) {
    const where: Prisma.NotificationWhereInput = { userId };
    if (unreadOnly) where.isRead = false;
    return prisma.$transaction([
      prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
    ]);
  },
  async markAsRead(id: string, userId: string) { return prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } }); },
  async markAllAsRead(userId: string) { return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } }); },
};
