import { PAGINATION_DEFAULTS } from '../../config/constants';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export function parsePagination(query: PaginationQuery): PaginationParams {
  const page = Math.max(1, parseInt(query.page ?? '', 10) || PAGINATION_DEFAULTS.PAGE);
  const rawLimit = parseInt(query.limit ?? '', 10) || PAGINATION_DEFAULTS.LIMIT;
  const limit = Math.min(Math.max(1, rawLimit), PAGINATION_DEFAULTS.MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

export function buildPaginationMeta(total: number, page: number, limit: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
