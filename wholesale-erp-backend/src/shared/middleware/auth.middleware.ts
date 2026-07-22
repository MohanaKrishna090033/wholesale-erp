import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../config/database';
import { ApiError } from '../utils/ApiError';
import { JwtAccessPayload } from '../types';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) throw ApiError.unauthorized('No access token provided');
    const token = header.slice('Bearer '.length);

    let payload: JwtAccessPayload;
    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) throw ApiError.unauthorized('Access token expired');
      throw ApiError.unauthorized('Invalid access token');
    }

    if (payload.type !== 'access') throw ApiError.unauthorized('Invalid token type');
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) throw ApiError.unauthorized('Account is inactive or no longer exists');
    req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    next();
  } catch (error) {
    next(error);
  }
}
