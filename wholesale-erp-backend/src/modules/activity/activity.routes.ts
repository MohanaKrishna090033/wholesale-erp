import { Router } from 'express';
import { activityController } from './activity.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { requireRole } from '../../shared/middleware/role.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { ROLE_GROUPS } from '../../config/constants';
import { listActivityQuerySchema } from './activity.schema';

export const activityRouter = Router();
activityRouter.use(authenticate);
activityRouter.get('/', requireRole(ROLE_GROUPS.ADMIN_ONLY), validate({ query: listActivityQuerySchema }), activityController.listAll);
activityRouter.get('/mine', requireRole(ROLE_GROUPS.ALL), validate({ query: listActivityQuerySchema }), activityController.listMine);
