import { prisma } from '../../config/database';

export const dashboardRepository = {
  async getKpiStats() {
    const [totalRevenueResult, totalCustomers, todaysSalesResult, lowStockCount, pendingFollowUps] = await Promise.all([
      prisma.challan.aggregate({ where: { status: { in: ['CONFIRMED', 'DISPATCHED', 'DELIVERED'] } }, _sum: { total: true } }),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.challan.aggregate({
        where: { status: { in: ['CONFIRMED', 'DISPATCHED', 'DELIVERED'] }, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        _sum: { total: true }, _count: { id: true },
      }),
      prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*) as count FROM products WHERE "isActive" = true AND "currentStock" <= "minStockLevel";`,
      prisma.followUp.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      totalRevenue: Number(totalRevenueResult._sum.total ?? 0),
      totalCustomers, todaysSalesRevenue: Number(todaysSalesResult._sum.total ?? 0),
      todaysSalesCount: todaysSalesResult._count.id, lowStockCount: Number(lowStockCount[0]?.count ?? 0),
      pendingFollowUps,
    };
  },

  async getSalesChart(days = 30) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const rawData = await prisma.$queryRaw<Array<{ date: string; revenue: number; orders: bigint }>>`
      SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, SUM(total)::float as revenue, COUNT(*)::bigint as orders
      FROM challans WHERE status IN ('CONFIRMED', 'DISPATCHED', 'DELIVERED') AND "createdAt" >= ${fromDate}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD') ORDER BY date ASC;
    `;
    return rawData.map((row) => ({ date: row.date, revenue: Number(row.revenue ?? 0), orders: Number(row.orders ?? 0) }));
  },

  async getRecentActivities(take = 10, userId?: string) {
    return prisma.activityLog.findMany({
      where: userId ? { userId } : undefined, take, orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, avatar: true, role: true } } },
    });
  },

  async getUpcomingFollowUps(take = 10, userId?: string) {
    return prisma.followUp.findMany({
      where: { status: 'PENDING', userId: userId ? userId : undefined, scheduledAt: { gte: new Date() } },
      take, orderBy: { scheduledAt: 'asc' },
      include: { customer: { select: { id: true, name: true, code: true, phone: true } }, user: { select: { name: true } } },
    });
  },

  async getLowStockAlerts(take = 10) {
    return prisma.$queryRaw<Array<{ id: string; sku: string; name: string; currentStock: number; minStockLevel: number; unit: string }>>`
      SELECT id, sku, name, "currentStock", "minStockLevel", unit FROM products
      WHERE "isActive" = true AND "currentStock" <= "minStockLevel"
      ORDER BY ("currentStock"::float / GREATEST("minStockLevel", 1)) ASC LIMIT ${take};
    `;
  },

  async getTopCustomers(take = 5) {
    const grouped = await prisma.challan.groupBy({
      by: ['customerId'], where: { status: { in: ['CONFIRMED', 'DISPATCHED', 'DELIVERED'] } },
      _sum: { total: true }, _count: { id: true }, orderBy: { _sum: { total: 'desc' } }, take,
    });
    const customerIds = grouped.map((g) => g.customerId);
    const customers = await prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true, code: true, phone: true } });
    const customerMap = new Map(customers.map((c) => [c.id, c]));
    return grouped.map((g) => ({
      customer: customerMap.get(g.customerId) ?? { name: 'Unknown', code: 'N/A' },
      totalRevenue: Number(g._sum.total ?? 0), orderCount: g._count.id,
    }));
  },

  async getTopProducts(take = 5) {
    const grouped = await prisma.challanItem.groupBy({
      by: ['productId', 'productName', 'productSku', 'unit'], _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } }, take,
    });
    return grouped.map((g) => ({
      productId: g.productId, name: g.productName, sku: g.productSku, unit: g.unit,
      totalQuantitySold: Number(g._sum.quantity ?? 0), totalRevenue: Number(g._sum.total ?? 0),
    }));
  },
};
