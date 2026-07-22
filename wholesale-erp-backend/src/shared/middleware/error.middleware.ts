import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { isProduction } from '../../config/env';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) logger.error({ err, path: req.path }, err.message);
    res.status(err.statusCode).json({ success: false, message: err.message, ...(err.details ? { errors: err.details } : {}) });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err);
    res.status(mapped.statusCode).json({ success: false, message: mapped.message });
    return;
  }
  logger.error({ err, path: req.path }, 'Unhandled error');
  res.status(500).json({ success: false, message: 'Something went wrong on our end', ...(isProduction ? {} : { stack: err instanceof Error ? err.stack : undefined }) });
}

function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): { statusCode: number; message: string; } {
  switch (err.code) {
    case 'P2002': {
      const field = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
      return { statusCode: 409, message: `A record with this ${field} already exists` };
    }
    case 'P2025': return { statusCode: 404, message: 'Record not found' };
    case 'P2003': return { statusCode: 409, message: 'This record is referenced by other data and cannot be modified' };
    default: return { statusCode: 500, message: 'Database error' };
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `Route ${req.method}${req.originalUrl} not found` });
}
