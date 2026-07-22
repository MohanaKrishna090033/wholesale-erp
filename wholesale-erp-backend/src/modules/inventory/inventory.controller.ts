import { Request, Response } from 'express';
import { inventoryService } from './inventory.service';
import { ApiResponse } from '../../shared/utils/response.helper';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export const inventoryController = {
  listProducts: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await inventoryService.listProducts(req.query as never);
    ApiResponse.paginated(res, data, meta, 'Products fetched successfully');
  }),
  getProductById: asyncHandler(async (req: Request, res: Response) => {
    const product = await inventoryService.getProductById(req.params.id);
    ApiResponse.success(res, product, 'Product fetched successfully');
  }),
  createProduct: asyncHandler(async (req: Request, res: Response) => {
    const product = await inventoryService.createProduct(req.body, req.user!.id, req.ip);
    ApiResponse.created(res, product, 'Product created successfully');
  }),
  updateProduct: asyncHandler(async (req: Request, res: Response) => {
    const product = await inventoryService.updateProduct(req.params.id, req.body, req.user!.id, req.ip);
    ApiResponse.success(res, product, 'Product updated successfully');
  }),
  adjustStock: asyncHandler(async (req: Request, res: Response) => {
    const result = await inventoryService.adjustStock(req.params.id, req.body, req.user!.id, req.ip);
    ApiResponse.success(res, result, 'Stock adjusted successfully');
  }),
  getMovements: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await inventoryService.getMovements(req.params.id, req.query as never);
    ApiResponse.paginated(res, data, meta, 'Stock movements fetched');
  }),
  listCategories: asyncHandler(async (_req: Request, res: Response) => {
    const categories = await inventoryService.listCategories();
    ApiResponse.success(res, categories, 'Categories fetched');
  }),
  createCategory: asyncHandler(async (req: Request, res: Response) => {
    const category = await inventoryService.createCategory(req.body);
    ApiResponse.created(res, category, 'Category created successfully');
  }),
  listWarehouses: asyncHandler(async (_req: Request, res: Response) => {
    const warehouses = await inventoryService.listWarehouses();
    ApiResponse.success(res, warehouses, 'Warehouses fetched');
  }),
  createWarehouse: asyncHandler(async (req: Request, res: Response) => {
    const warehouse = await inventoryService.createWarehouse(req.body);
    ApiResponse.created(res, warehouse, 'Warehouse created successfully');
  }),
  getLowStockAlerts: asyncHandler(async (_req: Request, res: Response) => {
    const alerts = await inventoryService.getLowStockAlerts();
    ApiResponse.success(res, alerts, 'Low stock alerts fetched');
  }),
};
