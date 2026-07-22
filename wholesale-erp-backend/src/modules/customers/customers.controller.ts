import { Request, Response } from 'express';
import { customersService } from './customers.service';
import { ApiResponse } from '../../shared/utils/response.helper';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export const customersController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await customersService.list(req.query as never);
    ApiResponse.paginated(res, data, meta, 'Customers fetched successfully');
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const customer = await customersService.getById(req.params.id);
    ApiResponse.success(res, customer, 'Customer details fetched');
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const customer = await customersService.create(req.body, req.user!.id, req.ip);
    ApiResponse.created(res, customer, 'Customer created successfully');
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const customer = await customersService.update(req.params.id, req.body, req.user!.id, req.ip);
    ApiResponse.success(res, customer, 'Customer updated successfully');
  }),
  addContact: asyncHandler(async (req: Request, res: Response) => {
    const contact = await customersService.addContact(req.params.id, req.body);
    ApiResponse.created(res, contact, 'Contact added successfully');
  }),
  addNote: asyncHandler(async (req: Request, res: Response) => {
    const note = await customersService.addNote(req.params.id, req.body, req.user!.id);
    ApiResponse.created(res, note, 'Note added successfully');
  }),
  deleteNote: asyncHandler(async (req: Request, res: Response) => {
    await customersService.deleteNote(req.params.id, req.params.noteId);
    ApiResponse.success(res, null, 'Note deleted successfully');
  }),
  addFollowUp: asyncHandler(async (req: Request, res: Response) => {
    const followUp = await customersService.addFollowUp(req.params.id, req.body, req.user!.id);
    ApiResponse.created(res, followUp, 'Follow-up scheduled successfully');
  }),
  updateFollowUp: asyncHandler(async (req: Request, res: Response) => {
    const followUp = await customersService.updateFollowUp(req.params.id, req.params.followUpId, req.body, req.user!.id);
    ApiResponse.success(res, followUp, 'Follow-up updated successfully');
  }),
  getTimeline: asyncHandler(async (req: Request, res: Response) => {
    const timeline = await customersService.getTimeline(req.params.id);
    ApiResponse.success(res, timeline, 'Customer timeline fetched');
  }),
};
