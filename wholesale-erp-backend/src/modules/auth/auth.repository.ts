import { prisma } from '../../config/database';

export const authRepository = {
  findUserByEmail(email: string) { return prisma.user.findUnique({ where: { email } }); },
  findUserById(id: string) { return prisma.user.findUnique({ where: { id } }); },
  updateLastLogin(userId: string) { return prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } }); },
  updateProfile(userId: string, data: { name?: string; avatar?: string }) { return prisma.user.update({ where: { id: userId }, data }); },
  updatePassword(userId: string, hashedPassword: string) { return prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } }); },
  storeRefreshToken(input: { id: string; token: string; userId: string; expiresAt: Date; userAgent?: string; ipAddress?: string; }) {
    return prisma.refreshToken.create({
      data: { id: input.id, token: input.token, userId: input.userId, expiresAt: input.expiresAt, userAgent: input.userAgent, ipAddress: input.ipAddress },
    });
  },
  findRefreshToken(id: string) { return prisma.refreshToken.findUnique({ where: { id } }); },
  revokeRefreshToken(id: string) { return prisma.refreshToken.update({ where: { id }, data: { revoked: true } }).catch(() => null); },
  revokeAllUserRefreshTokens(userId: string) { return prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } }); },
};
