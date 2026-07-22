import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

interface FindManyParams {
  skip: number;
  take: number;
  search?: string;
  tag?: string;
  isActive?: boolean;
}

export const customersRepository = {
  async findMany(params: FindManyParams) {
    const where: Prisma.CustomerWhereInput = {};
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search } },
        { gstNumber: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.tag) where.tags = { has: params.tag };
    if (params.isActive !== undefined) where.isActive = params.isActive;

    return prisma.$transaction([
      prisma.customer.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: {
          contacts: { where: { isPrimary: true }, take: 1 },
          _count: { select: { challans: true, followUps: { where: { status: 'PENDING' } } } },
        },
      }),
      prisma.customer.count({ where }),
    ]);
  },

  async findById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: { isPrimary: 'desc' } },
        notes: { orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }], include: { user: { select: { name: true, avatar: true } } } },
        followUps: { orderBy: { scheduledAt: 'asc' }, include: { user: { select: { name: true } } } },
        createdBy: { select: { name: true, email: true } },
      },
    });
  },

  async findByCodeOrPhone(phone: string, excludeId?: string) {
    return prisma.customer.findFirst({
      where: { phone, id: excludeId ? { not: excludeId } : undefined },
    });
  },

  async create(data: Prisma.CustomerUncheckedCreateInput) {
    return prisma.customer.create({ data });
  },

  async update(id: string, data: Prisma.CustomerUncheckedUpdateInput) {
    return prisma.customer.update({ where: { id }, data });
  },

  async addContact(customerId: string, data: Prisma.CustomerContactUncheckedCreateInput) {
    if (data.isPrimary) {
      await prisma.customerContact.updateMany({ where: { customerId }, data: { isPrimary: false } });
    }
    return prisma.customerContact.create({ data });
  },

  async addNote(customerId: string, userId: string, content: string, isPinned: boolean) {
    return prisma.customerNote.create({
      data: { customerId, userId, content, isPinned },
      include: { user: { select: { name: true, avatar: true } } },
    });
  },

  async deleteNote(noteId: string) {
    return prisma.customerNote.delete({ where: { id: noteId } });
  },

  async addFollowUp(customerId: string, userId: string, data: { title: string; description?: string; scheduledAt: Date }) {
    return prisma.followUp.create({
      data: { customerId, userId, title: data.title, description: data.description, scheduledAt: data.scheduledAt },
    });
  },

  async updateFollowUp(followUpId: string, status: 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED', description?: string) {
    return prisma.followUp.update({
      where: { id: followUpId },
      data: { status, description, completedAt: status === 'COMPLETED' ? new Date() : undefined },
    });
  },

  async getTimeline(customerId: string) {
    const [challans, followUps, notes, movements] = await Promise.all([
      prisma.challan.findMany({ where: { customerId }, select: { id: true, challanNumber: true, total: true, status: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.followUp.findMany({ where: { customerId }, select: { id: true, title: true, status: true, scheduledAt: true, completedAt: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.customerNote.findMany({ where: { customerId }, select: { id: true, content: true, isPinned: true, createdAt: true, user: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.activityLog.findMany({ where: { entityType: 'Customer', entityId: customerId }, select: { id: true, action: true, entityLabel: true, metadata: true, createdAt: true, user: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 30 }),
    ]);

    const events = [
      ...challans.map((c) => ({ type: 'CHALLAN', id: c.id, timestamp: c.createdAt, data: c })),
      ...followUps.map((f) => ({ type: 'FOLLOW_UP', id: f.id, timestamp: f.createdAt, data: f })),
      ...notes.map((n) => ({ type: 'NOTE', id: n.id, timestamp: n.createdAt, data: n })),
      ...movements.map((m) => ({ type: 'ACTIVITY', id: m.id, timestamp: m.createdAt, data: m })),
    ];

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 50);
  },
};
