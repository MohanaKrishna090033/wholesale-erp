import { dashboardRepository } from './dashboard.repository';
import { Role } from '@prisma/client';

export const dashboardService = {
  async getRoleBasedDashboard(role: Role, userId: string) {
    const stats = await dashboardRepository.getKpiStats();
    switch (role) {
      case 'ADMIN': {
        const [salesChart, recentActivity, upcomingFollowUps, lowStockAlerts, topCustomers, topProducts] = await Promise.all([
          dashboardRepository.getSalesChart(30), dashboardRepository.getRecentActivities(10),
          dashboardRepository.getUpcomingFollowUps(5), dashboardRepository.getLowStockAlerts(5),
          dashboardRepository.getTopCustomers(5), dashboardRepository.getTopProducts(5),
        ]);
        return { role, stats, salesChart, recentActivity, upcomingFollowUps, lowStockAlerts, topCustomers, topProducts };
      }
      case 'SALES': {
        const [recentActivity, upcomingFollowUps, topCustomers, topProducts] = await Promise.all([
          dashboardRepository.getRecentActivities(10, userId), dashboardRepository.getUpcomingFollowUps(10, userId),
          dashboardRepository.getTopCustomers(5), dashboardRepository.getTopProducts(5),
        ]);
        return { role, stats: { totalCustomers: stats.totalCustomers, todaysSalesRevenue: stats.todaysSalesRevenue, pendingFollowUps: stats.pendingFollowUps }, recentActivity, upcomingFollowUps, topCustomers, topProducts };
      }
      case 'WAREHOUSE': {
        const [recentActivity, lowStockAlerts, topProducts] = await Promise.all([
          dashboardRepository.getRecentActivities(10, userId), dashboardRepository.getLowStockAlerts(15),
          dashboardRepository.getTopProducts(10),
        ]);
        return { role, stats: { lowStockCount: stats.lowStockCount, todaysSalesCount: stats.todaysSalesCount }, recentActivity, lowStockAlerts, topProducts };
      }
      case 'ACCOUNTS': {
        const [salesChart, topCustomers] = await Promise.all([
          dashboardRepository.getSalesChart(30), dashboardRepository.getTopCustomers(10),
        ]);
        return { role, stats: { totalRevenue: stats.totalRevenue, todaysSalesRevenue: stats.todaysSalesRevenue, totalCustomers: stats.totalCustomers }, salesChart, topCustomers };
      }
      default: return { role, stats };
    }
  },
  async getSalesChart(days: number) { return dashboardRepository.getSalesChart(days); },
  async getLowStockAlerts() { return dashboardRepository.getLowStockAlerts(20); },
};
