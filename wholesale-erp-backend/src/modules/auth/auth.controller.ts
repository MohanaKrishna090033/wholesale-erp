import { Request, Response } from 'express';
import { authService } from './auth.service';
import { ApiResponse } from '../../shared/utils/response.helper';
import { ApiError } from '../../shared/utils/ApiError';
import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { COOKIE_NAMES } from '../../config/constants';
import { env, isProduction } from '../../config/env';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  domain: isProduction ? env.COOKIE_DOMAIN : undefined,
  path: `${env.API_PREFIX}/auth`,
};

function setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, token, { ...REFRESH_COOKIE_OPTIONS, expires: expiresAt });
}
function clearRefreshCookie(res: Response): void {
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, REFRESH_COOKIE_OPTIONS);
}

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body, { ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    setRefreshCookie(res, result.refreshToken, expiresAt);
    ApiResponse.success(res, { user: result.user, accessToken: result.accessToken }, 'Logged in successfully');
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
    if (!refreshToken) throw ApiError.unauthorized('No refresh token provided');
    const result = await authService.refresh(refreshToken, { ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    setRefreshCookie(res, result.refreshToken, expiresAt);
    ApiResponse.success(res, { user: result.user, accessToken: result.accessToken }, 'Token refreshed');
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
    await authService.logout(refreshToken, req.user!.id);
    clearRefreshCookie(res);
    ApiResponse.success(res, null, 'Logged out successfully');
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const profile = await authService.getProfile(req.user!.id);
    ApiResponse.success(res, profile, 'Profile fetched');
  }),

  updateMe: asyncHandler(async (req: Request, res: Response) => {
    const updated = await authService.updateProfile(req.user!.id, req.body);
    ApiResponse.success(res, updated, 'Profile updated');
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.changePassword(req.user!.id, req.body);
    ApiResponse.success(res, null, 'Password changed successfully. Please log in again.');
  }),
};
