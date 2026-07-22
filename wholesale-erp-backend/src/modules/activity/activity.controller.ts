import { Request, Response } from 'express';
import { activityService } from './activity.service';
import { ApiResponse } from '../../shared/utils/response.helper';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export const activityController = {
  listAll: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await activityService.list(req.query as never);
    ApiResponse.paginated(res, data, meta, 'Activity logs fetched');
  }),
  listMine: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await activityService.list(req.query as never, req.user!.id);
    ApiResponse.paginated(res, data, meta, 'Your activity logs fetched');
  }),
};
