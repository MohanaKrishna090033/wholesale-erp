import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SuccessPayload<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export class ApiResponse {
  static success<T>(res: Response, data: T, message = 'Success', statusCode = 200): Response {
    const payload: SuccessPayload<T> = { success: true, message, data };
    return res.status(statusCode).json(payload);
  }
  static created<T>(res: Response, data: T, message = 'Created successfully'): Response {
    return this.success(res, data, message, 201);
  }
  static paginated<T>(res: Response, data: T, meta: PaginationMeta, message = 'Success'): Response {
    const payload: SuccessPayload<T> = { success: true, message, data, meta };
    return res.status(200).json(payload);
  }
  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}
