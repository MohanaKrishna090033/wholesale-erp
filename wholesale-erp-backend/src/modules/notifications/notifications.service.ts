import { notificationsRepository } from './notifications.repository';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { ListNotificationsQuery } from './notifications.schema';

export const notificationsService = {
  async list(userId: string, query: ListNotificationsQuery) {
    const pagination = parsePagination(query);
    const [notifications, total] = await notificationsRepository.findMany(userId, pagination.skip, pagination.take, query.unreadOnly === 'true');
    return { data: notifications, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  },
  async markRead(id: string, userId: string) { await notificationsRepository.markAsRead(id, userId); },
  async markAllRead(userId: string) { await notificationsRepository.markAllAsRead(userId); },
};
