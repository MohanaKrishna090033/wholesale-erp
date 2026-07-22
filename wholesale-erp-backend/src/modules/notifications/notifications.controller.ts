import { Request, Response } from 'express';
import { notificationsService } from './notifications.service';
import { ApiResponse } from '../../shared/utils/response.helper';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export const notificationsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await notificationsService.list(req.user!.id, req.query as never);
    ApiResponse.paginated(res, data, meta, 'Notifications fetched successfully');
  }),
  markRead: asyncHandler(async (req: Request, res: Response) => {
    await notificationsService.markRead(req.params.id, req.user!.id);
    ApiResponse.success(res, null, 'Notification marked as read');
  }),
  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    await notificationsService.markAllRead(req.user!.id);
    ApiResponse.success(res, null, 'All notifications marked as read');
  }),
};
