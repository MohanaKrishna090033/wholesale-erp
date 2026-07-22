import { Request, Response } from 'express';
import { usersService } from './users.service';
import { ApiResponse } from '../../shared/utils/response.helper';
import { asyncHandler } from '../../shared/middleware/asyncHandler';

export const usersController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await usersService.list(req.query as never);
    ApiResponse.paginated(res, data, meta, 'Users fetched');
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.getById(req.params.id);
    ApiResponse.success(res, user, 'User fetched');
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.create(req.body, req.user!.id);
    ApiResponse.created(res, user, 'User created successfully');
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.update(req.params.id, req.body, req.user!.id);
    ApiResponse.success(res, user, 'User updated successfully');
  }),
  toggleActive: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.toggleActive(req.params.id, req.user!.id);
    ApiResponse.success(res, user, user.isActive ? 'User activated' : 'User deactivated');
  }),
};
