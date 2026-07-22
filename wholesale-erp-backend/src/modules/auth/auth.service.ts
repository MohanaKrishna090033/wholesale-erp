import { authRepository } from './auth.repository';
import { comparePassword, hashPassword } from '../../shared/utils/crypto';
import { ApiError } from '../../shared/utils/ApiError';
import { logActivity } from '../../shared/services/activity.service';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './token.util';
import { ChangePasswordInput, LoginInput, UpdateProfileInput } from './auth.schema';

interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

function sanitizeUser<T extends { password: string }>(user: T) {
  const { password: _password, ...safe } = user;
  return safe;
}

export const authService = {
  async login(input: LoginInput, ctx: RequestContext) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) throw ApiError.unauthorized('Invalid email or password');
    if (!user.isActive) throw ApiError.forbidden('Your account has been deactivated. Contact an administrator.');
    const passwordMatches = await comparePassword(input.password, user.password);
    if (!passwordMatches) throw ApiError.unauthorized('Invalid email or password');

    const accessToken = signAccessToken(user);
    const { token: refreshToken, jti, expiresAt } = signRefreshToken(user.id);

    await authRepository.storeRefreshToken({ id: jti, token: refreshToken, userId: user.id, expiresAt, userAgent: ctx.userAgent, ipAddress: ctx.ipAddress });
    await authRepository.updateLastLogin(user.id);
    await logActivity({ userId: user.id, action: 'USER_LOGIN', entityType: 'User', entityId: user.id, entityLabel: `User: ${user.name}`, ipAddress: ctx.ipAddress });

    return { user: sanitizeUser(user), accessToken, refreshToken };
  },

  async refresh(refreshToken: string, ctx: RequestContext) {
    let payload;
    try { payload = verifyRefreshToken(refreshToken); } catch { throw ApiError.unauthorized('Invalid or expired refresh token'); }
    const storedToken = await authRepository.findRefreshToken(payload.jti);
    if (!storedToken || storedToken.revoked || storedToken.token !== refreshToken) throw ApiError.unauthorized('Refresh token has been revoked or is invalid');
    if (storedToken.expiresAt < new Date()) throw ApiError.unauthorized('Refresh token has expired');

    const user = await authRepository.findUserById(payload.sub);
    if (!user || !user.isActive) throw ApiError.unauthorized('Account is inactive or no longer exists');

    await authRepository.revokeRefreshToken(storedToken.id);
    const accessToken = signAccessToken(user);
    const { token: newRefreshToken, jti, expiresAt } = signRefreshToken(user.id);

    await authRepository.storeRefreshToken({ id: jti, token: newRefreshToken, userId: user.id, expiresAt, userAgent: ctx.userAgent, ipAddress: ctx.ipAddress });
    return { user: sanitizeUser(user), accessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken: string | undefined, userId: string): Promise<void> {
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await authRepository.revokeRefreshToken(payload.jti);
      } catch {}
    }
    await logActivity({ userId, action: 'USER_LOGOUT', entityType: 'User', entityId: userId });
  },

  async getProfile(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return sanitizeUser(user);
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const data: { name?: string; avatar?: string } = {};
    if (input.name) data.name = input.name;
    if (input.avatar) data.avatar = input.avatar;
    const updated = await authRepository.updateProfile(userId, data);
    await logActivity({ userId, action: 'USER_UPDATED', entityType: 'User', entityId: userId, entityLabel: `User: ${updated.name}` });
    return sanitizeUser(updated);
  },

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await authRepository.findUserById(userId);
    if (!user) throw ApiError.notFound('User not found');
    const matches = await comparePassword(input.currentPassword, user.password);
    if (!matches) throw ApiError.badRequest('Current password is incorrect');
    const hashed = await hashPassword(input.newPassword);
    await authRepository.updatePassword(userId, hashed);
    await authRepository.revokeAllUserRefreshTokens(userId);
    await logActivity({ userId, action: 'USER_UPDATED', entityType: 'User', entityId: userId, entityLabel: `User: ${user.name}`, metadata: { passwordChanged: true } });
  },
};
