import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { requireRole } from '../../shared/middleware/role.middleware';
import { ROLE_GROUPS } from '../../config/constants';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);
dashboardRouter.get('/stats', requireRole(ROLE_GROUPS.ALL), dashboardController.getStats);
dashboardRouter.get('/sales-chart', requireRole(ROLE_GROUPS.FINANCE_TEAM), dashboardController.getSalesChart);
dashboardRouter.get('/low-stock-alerts', requireRole(ROLE_GROUPS.WAREHOUSE_TEAM), dashboardController.getLowStockAlerts);
