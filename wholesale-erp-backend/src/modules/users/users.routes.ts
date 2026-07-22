import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { requireRole } from '../../shared/middleware/role.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { ROLE_GROUPS } from '../../config/constants';
import { createUserSchema, updateUserSchema, listUsersQuerySchema, userIdParamSchema } from './users.schema';

export const usersRouter = Router();
usersRouter.use(authenticate, requireRole(ROLE_GROUPS.ADMIN_ONLY));
usersRouter.get('/', validate({ query: listUsersQuerySchema }), usersController.list);
usersRouter.post('/', validate({ body: createUserSchema }), usersController.create);
usersRouter.get('/:id', validate({ params: userIdParamSchema }), usersController.getById);
usersRouter.patch('/:id', validate({ params: userIdParamSchema, body: updateUserSchema }), usersController.update);
usersRouter.patch('/:id/toggle-active', validate({ params: userIdParamSchema }), usersController.toggleActive);
