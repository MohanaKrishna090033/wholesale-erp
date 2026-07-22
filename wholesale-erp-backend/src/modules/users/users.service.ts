import { usersRepository } from './users.repository';
import { ApiError } from '../../shared/utils/ApiError';
import { hashPassword } from '../../shared/utils/crypto';
import { logActivity } from '../../shared/services/activity.service';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { CreateUserInput, ListUsersQuery, UpdateUserInput } from './users.schema';
import { prisma } from '../../config/database';

export const usersService = {
  async list(query: ListUsersQuery) {
    const pagination = parsePagination(query);
    const [users, total] = await usersRepository.findMany({
      skip: pagination.skip, take: pagination.take, search: query.search, role: query.role,
      isActive: query.isActive === undefined ? undefined : query.isActive === 'true',
    });
    return { data: users, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  },

  async getById(id: string) {
    const user = await usersRepository.findById(id);
    if (!user) throw ApiError.notFound('User not found');
    return user;
  },

  async create(input: CreateUserInput, actorId: string) {
    const existing = await usersRepository.findByEmail(input.email);
    if (existing) throw ApiError.conflict('A user with this email already exists');
    const hashedPassword = await hashPassword(input.password);
    const user = await usersRepository.create({ name: input.name, email: input.email, password: hashedPassword, role: input.role, avatar: input.avatar });
    await logActivity({ userId: actorId, action: 'USER_CREATED', entityType: 'User', entityId: user.id, entityLabel: `User: ${user.name}`, metadata: { role: user.role } });
    return user;
  },

  async update(id: string, input: UpdateUserInput, actorId: string) {
    const existing = await usersRepository.findById(id);
    if (!existing) throw ApiError.notFound('User not found');
    if (input.email && input.email !== existing.email) {
      const emailTaken = await usersRepository.findByEmail(input.email);
      if (emailTaken) throw ApiError.conflict('A user with this email already exists');
    }
    if (input.role && existing.role !== input.role && actorId === id) throw ApiError.forbidden('You cannot change your own role');
    const data: Partial<{ name: string; email: string; role: typeof input.role; avatar: string }> = {};
    if (input.name) data.name = input.name; if (input.email) data.email = input.email; if (input.role) data.role = input.role; if (input.avatar !== undefined) data.avatar = input.avatar;
    const updated = await usersRepository.update(id, data);
    await logActivity({ userId: actorId, action: 'USER_UPDATED', entityType: 'User', entityId: updated.id, entityLabel: `User: ${updated.name}` });
    return updated;
  },

  async toggleActive(id: string, actorId: string) {
    if (id === actorId) throw ApiError.forbidden('You cannot deactivate your own account');
    const existing = await usersRepository.findById(id);
    if (!existing) throw ApiError.notFound('User not found');
    const nextState = !existing.isActive;
    const updated = await usersRepository.toggleActive(id, nextState);
    if (!nextState) await prisma.refreshToken.updateMany({ where: { userId: id }, data: { revoked: true } });
    await logActivity({ userId: actorId, action: 'USER_UPDATED', entityType: 'User', entityId: updated.id, entityLabel: `User: ${updated.name}`, metadata: { isActive: nextState } });
    return updated;
  },
};
