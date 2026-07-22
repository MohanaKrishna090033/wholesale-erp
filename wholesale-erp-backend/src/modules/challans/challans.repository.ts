import { Prisma, ChallanStatus } from '@prisma/client';
import { prisma } from '../../config/database';

interface FindChallansParams {
  skip: number; take: number; search?: string; customerId?: string;
  status?: ChallanStatus; fromDate?: Date; toDate?: Date;
}

export const challansRepository = {
  async findMany(params: FindChallansParams) {
    const where: Prisma.ChallanWhereInput = {};
    if (params.search) {
      where.OR = [
        { challanNumber: { contains: params.search, mode: 'insensitive' } },
        { customer: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }
    if (params.customerId) where.customerId = params.customerId;
    if (params.status) where.status = params.status;
    if (params.fromDate || params.toDate) {
      where.createdAt = {};
      if (params.fromDate) where.createdAt.gte = params.fromDate;
      if (params.toDate) where.createdAt.lte = params.toDate;
    }

    return prisma.$transaction([
      prisma.challan.findMany({
        where, skip: params.skip, take: params.take, orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, code: true, name: true, phone: true } },
          user: { select: { name: true } }, _count: { select: { items: true } },
        },
      }),
      prisma.challan.count({ where }),
    ]);
  },

  async findById(id: string) {
    return prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true, user: { select: { id: true, name: true, email: true } },
        items: { include: { product: { select: { id: true, sku: true, name: true, currentStock: true, unit: true } } } },
      },
    });
  },

  async create(data: Prisma.ChallanUncheckedCreateInput, items: Prisma.ChallanItemUncheckedCreateWithoutChallanInput[]) {
    return prisma.challan.create({ data: { ...data, items: { create: items } }, include: { items: true, customer: true } });
  },

  async updateStatus(id: string, status: ChallanStatus, timestampField?: 'confirmedAt' | 'dispatchedAt' | 'deliveredAt' | 'cancelledAt') {
    const data: Prisma.ChallanUpdateInput = { status };
    if (timestampField) data[timestampField] = new Date();
    return prisma.challan.update({ where: { id }, data, include: { customer: true, items: true } });
  },
};
