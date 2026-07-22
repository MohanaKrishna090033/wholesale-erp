import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service';
import { ApiResponse } from '../../shared/utils/response.helper';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export const dashboardController = {
  getStats: asyncHandler(async (req: Request, res: Response) => {
    const data = await dashboardService.getRoleBasedDashboard(req.user!.role, req.user!.id);
    ApiResponse.success(res, data, 'Dashboard statistics fetched');
  }),
  getSalesChart: asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string, 10) || 30;
    const data = await dashboardService.getSalesChart(days);
    ApiResponse.success(res, data, 'Sales chart data fetched');
  }),
  getLowStockAlerts: asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.getLowStockAlerts();
    ApiResponse.success(res, data, 'Low stock alerts fetched');
  }),
};
