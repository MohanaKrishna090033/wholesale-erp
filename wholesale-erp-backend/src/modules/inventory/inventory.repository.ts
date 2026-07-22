import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

interface FindProductsParams {
  skip: number;
  take: number;
  search?: string;
  categoryId?: string;
  warehouseId?: string;
  lowStock?: boolean;
  isActive?: boolean;
}

export const inventoryRepository = {
  async findProducts(params: FindProductsParams) {
    const where: Prisma.ProductWhereInput = {};
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.lowStock) {
      where.currentStock = { lte: prisma.product.fields.minStockLevel as never };
    }

    return prisma.$transaction([
      prisma.product.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { name: 'asc' },
        include: {
          category: { select: { id: true, name: true, color: true } },
          warehouse: { select: { id: true, name: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);
  },

  async findProductById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        warehouse: true,
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { user: { select: { name: true } }, challan: { select: { challanNumber: true } } },
        },
      },
    });
  },

  async findProductBySku(sku: string) { return prisma.product.findUnique({ where: { sku } }); },
  async createProduct(data: Prisma.ProductUncheckedCreateInput) { return prisma.product.create({ data, include: { category: true, warehouse: true } }); },
  async updateProduct(id: string, data: Prisma.ProductUncheckedUpdateInput) { return prisma.product.update({ where: { id }, data, include: { category: true, warehouse: true } }); },

  async getMovements(productId: string, skip: number, take: number) {
    return prisma.$transaction([
      prisma.stockMovement.findMany({
        where: { productId }, skip, take, orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } }, challan: { select: { challanNumber: true } } },
      }),
      prisma.stockMovement.count({ where: { productId } }),
    ]);
  },

  async listCategories() { return prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } }); },
  async createCategory(data: { name: string; slug: string; color?: string }) { return prisma.category.create({ data }); },
  async listWarehouses() { return prisma.warehouse.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } }); },
  async createWarehouse(data: { name: string; location?: string }) { return prisma.warehouse.create({ data }); },

  async getLowStockAlerts() {
    return prisma.$queryRaw<Array<{ id: string; sku: string; name: string; currentStock: number; minStockLevel: number; unit: string }>>`
      SELECT id, sku, name, "currentStock", "minStockLevel", unit FROM products
      WHERE "isActive" = true AND "currentStock" <= "minStockLevel"
      ORDER BY ("currentStock"::float / GREATEST("minStockLevel", 1)) ASC LIMIT 50;
    `;
  },
};
