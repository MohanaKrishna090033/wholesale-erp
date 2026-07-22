import { Router } from 'express';
import { challansController } from './challans.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { requireRole } from '../../shared/middleware/role.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { ROLE_GROUPS } from '../../config/constants';
import { createChallanSchema, listChallansQuerySchema } from './challans.schema';

export const challansRouter = Router();
challansRouter.use(authenticate);
challansRouter.get('/', requireRole(ROLE_GROUPS.ALL), validate({ query: listChallansQuerySchema }), challansController.list);
challansRouter.get('/:id', requireRole(ROLE_GROUPS.ALL), challansController.getById);
challansRouter.get('/:id/invoice', requireRole(ROLE_GROUPS.ALL), challansController.getInvoiceHtml);
challansRouter.post('/', requireRole(ROLE_GROUPS.SALES_TEAM), validate({ body: createChallanSchema }), challansController.createDraft);
challansRouter.post('/:id/confirm', requireRole(ROLE_GROUPS.SALES_TEAM), challansController.confirm);
challansRouter.post('/:id/dispatch', requireRole(ROLE_GROUPS.WAREHOUSE_TEAM), challansController.dispatch);
challansRouter.post('/:id/deliver', requireRole(ROLE_GROUPS.WAREHOUSE_TEAM), challansController.deliver);
challansRouter.post('/:id/cancel', requireRole(ROLE_GROUPS.ADMIN_ONLY), challansController.cancel);
