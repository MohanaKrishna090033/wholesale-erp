import { inventoryRepository } from './inventory.repository';
import { ApiError } from '../../shared/utils/ApiError';
import { generateProductSku } from '../../shared/utils/codegen';
import { logActivity } from '../../shared/services/activity.service';
import { notifyRoles } from '../../shared/services/notification.service';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import { prisma } from '../../config/database';
import {
  CreateProductInput, UpdateProductInput, AdjustStockInput,
  CreateCategoryInput, CreateWarehouseInput, ListProductsQuery,
} from './inventory.schema';

export const inventoryService = {
  async listProducts(query: ListProductsQuery) {
    const pagination = parsePagination(query);
    const [products, total] = await inventoryRepository.findProducts({
      skip: pagination.skip, take: pagination.take, search: query.search,
      categoryId: query.categoryId, warehouseId: query.warehouseId,
      lowStock: query.lowStock === 'true', isActive: query.isActive === undefined ? undefined : query.isActive === 'true',
    });
    return { data: products, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  },

  async getProductById(id: string) {
    const product = await inventoryRepository.findProductById(id);
    if (!product) throw ApiError.notFound('Product not found');
    return product;
  },

  async createProduct(input: CreateProductInput, actorId: string, ipAddress?: string) {
    const sku = await generateProductSku();
    const product = await inventoryRepository.createProduct({ ...input, sku });

    if (input.currentStock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id, userId: actorId, type: 'INWARD',
          quantity: input.currentStock, balanceAfter: input.currentStock,
          unitCost: input.costPrice, reference: 'INITIAL_STOCK', notes: 'Initial stock on product creation',
        },
      });
    }
    await logActivity({
      userId: actorId, action: 'PRODUCT_CREATED', entityType: 'Product',
      entityId: product.id, entityLabel: `${product.name} (${product.sku})`,
      metadata: { initialStock: input.currentStock, sellingPrice: input.sellingPrice }, ipAddress,
    });
    return product;
  },

  async updateProduct(id: string, input: UpdateProductInput, actorId: string, ipAddress?: string) {
    await this.getProductById(id);
    const updated = await inventoryRepository.updateProduct(id, input as never);
    await logActivity({
      userId: actorId, action: 'PRODUCT_UPDATED', entityType: 'Product',
      entityId: updated.id, entityLabel: `${updated.name} (${updated.sku})`,
      metadata: { changes: Object.keys(input) }, ipAddress,
    });
    return updated;
  },

  async adjustStock(productId: string, input: AdjustStockInput, actorId: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw ApiError.notFound('Product not found');

      let newStock = product.currentStock;
      if (input.type === 'INWARD' || input.type === 'RETURN') {
        newStock += input.quantity;
      } else if (input.type === 'OUTWARD') {
        if (product.currentStock < input.quantity) {
          throw ApiError.unprocessable(`Insufficient stock for ${product.name}. Available: ${product.currentStock}, Requested:${input.quantity}`);
        }
        newStock -= input.quantity;
      } else if (input.type === 'ADJUSTMENT') {
        newStock = input.quantity;
      }

      const updatedProduct = await tx.product.update({ where: { id: productId }, data: { currentStock: newStock } });
      const movement = await tx.stockMovement.create({
        data: {
          productId, userId: actorId, type: input.type,
          quantity: input.type === 'ADJUSTMENT' ? Math.abs(newStock - product.currentStock) : input.quantity,
          balanceAfter: newStock, unitCost: input.unitCost ?? product.costPrice,
          reference: input.reference ?? 'MANUAL_ADJUSTMENT', notes: input.notes,
        },
      });

      const action = newStock > product.currentStock ? 'STOCK_INCREASED' : 'STOCK_DECREASED';
      await logActivity(
        {
          userId: actorId, action: input.type === 'ADJUSTMENT' ? 'STOCK_ADJUSTED' : action,
          entityType: 'Product', entityId: productId, entityLabel: `${product.name} (${product.sku})`,
          metadata: { previousStock: product.currentStock, newStock, type: input.type }, ipAddress,
        },
        tx
      );

      if (newStock <= product.minStockLevel && product.currentStock > product.minStockLevel) {
        await notifyRoles(
          ['ADMIN', 'WAREHOUSE'],
          {
            title: 'Low Stock Warning',
            message: `Stock for ${product.name} (${product.sku}) has reached ${newStock}${product.unit}. Minimum threshold is ${product.minStockLevel}.`,
            type: 'warning', actionUrl: `/inventory/${product.id}`,
          },
          tx
        );
      }
      return { product: updatedProduct, movement };
    });
  },

  async getMovements(productId: string, query: { page?: string; limit?: string }) {
    await this.getProductById(productId);
    const pagination = parsePagination(query);
    const [movements, total] = await inventoryRepository.getMovements(productId, pagination.skip, pagination.take);
    return { data: movements, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  },

  async listCategories() { return inventoryRepository.listCategories(); },
  async createCategory(input: CreateCategoryInput) {
    try { return await inventoryRepository.createCategory(input); } catch { throw ApiError.conflict('Category name or slug already exists'); }
  },
  async listWarehouses() { return inventoryRepository.listWarehouses(); },
  async createWarehouse(input: CreateWarehouseInput) { return inventoryRepository.createWarehouse(input); },
  async getLowStockAlerts() { return inventoryRepository.getLowStockAlerts(); },
};
