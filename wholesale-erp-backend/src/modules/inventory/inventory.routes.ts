import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { requireRole } from '../../shared/middleware/role.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { ROLE_GROUPS } from '../../config/constants';
import {
  createProductSchema, updateProductSchema, adjustStockSchema,
  createCategorySchema, createWarehouseSchema, listProductsQuerySchema,
} from './inventory.schema';

export const inventoryRouter = Router();
inventoryRouter.use(authenticate);
inventoryRouter.get('/products', requireRole(ROLE_GROUPS.ALL), validate({ query: listProductsQuerySchema }), inventoryController.listProducts);
inventoryRouter.get('/products/low-stock', requireRole(ROLE_GROUPS.ALL), inventoryController.getLowStockAlerts);
inventoryRouter.get('/products/:id', requireRole(ROLE_GROUPS.ALL), inventoryController.getProductById);
inventoryRouter.get('/products/:id/movements', requireRole(ROLE_GROUPS.ALL), inventoryController.getMovements);
inventoryRouter.post('/products', requireRole(ROLE_GROUPS.WAREHOUSE_TEAM), validate({ body: createProductSchema }), inventoryController.createProduct);
inventoryRouter.patch('/products/:id', requireRole(ROLE_GROUPS.WAREHOUSE_TEAM), validate({ body: updateProductSchema }), inventoryController.updateProduct);
inventoryRouter.post('/products/:id/stock', requireRole(ROLE_GROUPS.WAREHOUSE_TEAM), validate({ body: adjustStockSchema }), inventoryController.adjustStock);
inventoryRouter.get('/categories', requireRole(ROLE_GROUPS.ALL), inventoryController.listCategories);
inventoryRouter.post('/categories', requireRole(ROLE_GROUPS.ADMIN_ONLY), validate({ body: createCategorySchema }), inventoryController.createCategory);
inventoryRouter.get('/warehouses', requireRole(ROLE_GROUPS.ALL), inventoryController.listWarehouses);
inventoryRouter.post('/warehouses', requireRole(ROLE_GROUPS.ADMIN_ONLY), validate({ body: createWarehouseSchema }), inventoryController.createWarehouse);
