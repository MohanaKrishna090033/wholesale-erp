import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

export function requireRole(allowedRoles: readonly Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) { next(ApiError.unauthorized()); return; }
    if (!allowedRoles.includes(req.user.role)) {
      next(ApiError.forbidden(`This action requires one of the following roles: ${allowedRoles.join(', ')}`));
      return;
    }
    next();
  };
}
