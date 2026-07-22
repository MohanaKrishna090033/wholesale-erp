import { Request, Response } from 'express';
import { challansService } from './challans.service';
import { ApiResponse } from '../../shared/utils/response.helper';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export const challansController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await challansService.list(req.query as never);
    ApiResponse.paginated(res, data, meta, 'Challans fetched successfully');
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const challan = await challansService.getById(req.params.id);
    ApiResponse.success(res, challan, 'Challan fetched successfully');
  }),
  createDraft: asyncHandler(async (req: Request, res: Response) => {
    const challan = await challansService.createDraft(req.body, req.user!.id, req.ip);
    ApiResponse.created(res, challan, 'Draft challan created successfully');
  }),
  confirm: asyncHandler(async (req: Request, res: Response) => {
    const challan = await challansService.confirm(req.params.id, req.user!.id, req.ip);
    ApiResponse.success(res, challan, 'Challan confirmed successfully');
  }),
  dispatch: asyncHandler(async (req: Request, res: Response) => {
    const challan = await challansService.dispatch(req.params.id, req.user!.id, req.ip);
    ApiResponse.success(res, challan, 'Challan marked as dispatched');
  }),
  deliver: asyncHandler(async (req: Request, res: Response) => {
    const challan = await challansService.deliver(req.params.id, req.user!.id, req.ip);
    ApiResponse.success(res, challan, 'Challan marked as delivered');
  }),
  cancel: asyncHandler(async (req: Request, res: Response) => {
    const challan = await challansService.cancel(req.params.id, req.user!.id, req.ip);
    ApiResponse.success(res, challan, 'Challan cancelled successfully');
  }),
  getInvoiceHtml: asyncHandler(async (req: Request, res: Response) => {
    const html = await challansService.generateInvoiceHtml(req.params.id);
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  }),
};
