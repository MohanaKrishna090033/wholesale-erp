import { activityRepository } from './activity.repository';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { ListActivityQuery } from './activity.schema';

export const activityService = {
  async list(query: ListActivityQuery, currentUserId?: string) {
    const pagination = parsePagination(query);
    const [logs, total] = await activityRepository.findMany({
      skip: pagination.skip, take: pagination.take, userId: currentUserId ?? query.userId,
      entityType: query.entityType, action: query.action as never,
    });
    return { data: logs, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  },
};
