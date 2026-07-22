import { Router } from 'express';
import { customersController } from './customers.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { requireRole } from '../../shared/middleware/role.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { ROLE_GROUPS } from '../../config/constants';
import {
  createCustomerSchema, updateCustomerSchema, createContactSchema,
  createNoteSchema, createFollowUpSchema, updateFollowUpSchema, listCustomersQuerySchema,
} from './customers.schema';

export const customersRouter = Router();
customersRouter.use(authenticate);
customersRouter.get('/', requireRole(ROLE_GROUPS.CUSTOMER_ACCESS), validate({ query: listCustomersQuerySchema }), customersController.list);
customersRouter.get('/:id', requireRole(ROLE_GROUPS.CUSTOMER_ACCESS), customersController.getById);
customersRouter.get('/:id/timeline', requireRole(ROLE_GROUPS.CUSTOMER_ACCESS), customersController.getTimeline);
customersRouter.post('/', requireRole(ROLE_GROUPS.SALES_TEAM), validate({ body: createCustomerSchema }), customersController.create);
customersRouter.patch('/:id', requireRole(ROLE_GROUPS.SALES_TEAM), validate({ body: updateCustomerSchema }), customersController.update);
customersRouter.post('/:id/contacts', requireRole(ROLE_GROUPS.SALES_TEAM), validate({ body: createContactSchema }), customersController.addContact);
customersRouter.post('/:id/notes', requireRole(ROLE_GROUPS.SALES_TEAM), validate({ body: createNoteSchema }), customersController.addNote);
customersRouter.delete('/:id/notes/:noteId', requireRole(ROLE_GROUPS.SALES_TEAM), customersController.deleteNote);
customersRouter.post('/:id/follow-ups', requireRole(ROLE_GROUPS.SALES_TEAM), validate({ body: createFollowUpSchema }), customersController.addFollowUp);
customersRouter.patch('/:id/follow-ups/:followUpId', requireRole(ROLE_GROUPS.SALES_TEAM), validate({ body: updateFollowUpSchema }), customersController.updateFollowUp);
