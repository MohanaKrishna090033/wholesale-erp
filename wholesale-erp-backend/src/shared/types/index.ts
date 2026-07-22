import { Role } from '@prisma/client';

export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: Role;
  name: string;
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: string;
  type: 'refresh';
  jti: string;
}

export type { Role };
