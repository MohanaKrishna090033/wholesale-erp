import { Prisma, ActivityAction } from '@prisma/client';
import { prisma } from '../../config/database';

interface FindActivitiesParams { skip: number; take: number; userId?: string; entityType?: string; action?: ActivityAction; }

export const activityRepository = {
  async findMany(params: FindActivitiesParams) {
    const where: Prisma.ActivityLogWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.entityType) where.entityType = params.entityType;
    if (params.action) where.action = params.action;

    return prisma.$transaction([
      prisma.activityLog.findMany({
        where, skip: params.skip, take: params.take, orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true, role: true, avatar: true } } },
      }),
      prisma.activityLog.count({ where }),
    ]);
  },
};
