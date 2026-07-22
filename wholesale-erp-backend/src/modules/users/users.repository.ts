import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../config/database';

interface FindManyParams { skip: number; take: number; search?: string; role?: Role; isActive?: boolean; }
const USER_SAFE_SELECT = { id: true, name: true, email: true, role: true, avatar: true, isActive: true, lastLoginAt: true, createdAt: true, updatedAt: true } satisfies Prisma.UserSelect;

function buildWhere(params: Pick<FindManyParams, 'search' | 'role' | 'isActive'>): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};
  if (params.search) where.OR = [{ name: { contains: params.search, mode: 'insensitive' } }, { email: { contains: params.search, mode: 'insensitive' } }];
  if (params.role) where.role = params.role;
  if (params.isActive !== undefined) where.isActive = params.isActive;
  return where;
}

export const usersRepository = {
  findMany(params: FindManyParams) {
    const where = buildWhere(params);
    return prisma.$transaction([
      prisma.user.findMany({ where, select: USER_SAFE_SELECT, skip: params.skip, take: params.take, orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ]);
  },
  findById(id: string) { return prisma.user.findUnique({ where: { id }, select: USER_SAFE_SELECT }); },
  findByEmail(email: string) { return prisma.user.findUnique({ where: { email } }); },
  create(data: { name: string; email: string; password: string; role: Role; avatar?: string }) { return prisma.user.create({ data, select: USER_SAFE_SELECT }); },
  update(id: string, data: Partial<{ name: string; email: string; role: Role; avatar: string }>) { return prisma.user.update({ where: { id }, data, select: USER_SAFE_SELECT }); },
  toggleActive(id: string, isActive: boolean) { return prisma.user.update({ where: { id }, data: { isActive }, select: USER_SAFE_SELECT }); },
};
