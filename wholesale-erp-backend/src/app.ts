import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { globalLimiter } from './shared/middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './shared/middleware/error.middleware';

import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { customersRouter } from './modules/customers/customers.routes';
import { inventoryRouter } from './modules/inventory/inventory.routes';
import { challansRouter } from './modules/challans/challans.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { activityRouter } from './modules/activity/activity.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/health' },
    })
  );
  app.use(globalLimiter);

  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'OK', timestamp: new Date().toISOString() });
  });

  const api = env.API_PREFIX;
  app.use(`${api}/auth`, authRouter);
  app.use(`${api}/users`, usersRouter);
  app.use(`${api}/customers`, customersRouter);
  app.use(`${api}/inventory`, inventoryRouter);
  app.use(`${api}/challans`, challansRouter);
  app.use(`${api}/dashboard`, dashboardRouter);
  app.use(`${api}/activity`, activityRouter);
  app.use(`${api}/notifications`, notificationsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
