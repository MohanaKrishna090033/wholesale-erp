import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '../../config/env';
import { JwtAccessPayload, JwtRefreshPayload, Role } from '../../shared/types';

interface UserForToken {
  id: string;
  email: string;
  role: Role;
  name: string;
}

export function signAccessToken(user: UserForToken): string {
  const payload: JwtAccessPayload = { sub: user.id, email: user.email, role: user.role, name: user.name, type: 'access' };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions);
}

export function signRefreshToken(userId: string): { token: string; jti: string; expiresAt: Date } {
  const jti = randomUUID();
  const payload: JwtRefreshPayload = { sub: userId, type: 'refresh', jti };
  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
  const expiresAt = new Date();
  expiresAt.setTime(expiresAt.getTime() + parseExpiryToMs(env.JWT_REFRESH_EXPIRES_IN));
  return { token, jti, expiresAt };
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
}

function parseExpiryToMs(expiry: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiry);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * multipliers[unit];
}
