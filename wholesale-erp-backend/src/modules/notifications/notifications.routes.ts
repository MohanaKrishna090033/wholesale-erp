import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { requireRole } from '../../shared/middleware/role.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { ROLE_GROUPS } from '../../config/constants';
import { listNotificationsQuerySchema } from './notifications.schema';

export const notificationsRouter = Router();
notificationsRouter.use(authenticate, requireRole(ROLE_GROUPS.ALL));
notificationsRouter.get('/', validate({ query: listNotificationsQuerySchema }), notificationsController.list);
notificationsRouter.patch('/:id/read', notificationsController.markRead);
notificationsRouter.patch('/read-all', notificationsController.markAllRead);
