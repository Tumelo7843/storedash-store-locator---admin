import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { storesRouter, adminStoresRouter } from './routes/stores.routes.js';
import { productsRouter, adminProductsRouter } from './routes/products.routes.js';
import { servicesRouter, adminServicesRouter } from './routes/services.routes.js';
import { ordersRouter, adminOrdersRouter } from './routes/orders.routes.js';
import { adminDashboardRouter } from './routes/dashboard.routes.js';
import { uploadsRouter } from './routes/uploads.routes.js';
import { adminStoreOwnerApplicationsRouter, storeOwnerApplicationsRouter } from './routes/storeOwnerApplications.routes.js';
import { storeOwnersRouter } from './routes/storeOwners.routes.js';

const app = express();

app.set('trust proxy', 1); // required for correct client IPs behind Render's proxy (rate limiting, logging)

app.use(helmet());
app.use(
  cors({
    origin: env.allowedOrigins,
    credentials: false,
  }),
);
app.use(express.json({ limit: '2mb' }));

// Generous global ceiling against abuse; write-heavy admin routes could get a
// tighter limit later if usage patterns justify it.
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/stores', storesRouter);
app.use('/api/products', productsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin/stores', adminStoresRouter);
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/admin/services', adminServicesRouter);
app.use('/api/admin/orders', adminOrdersRouter);
app.use('/api/admin/dashboard', adminDashboardRouter);
app.use('/api/admin/uploads', uploadsRouter);
app.use('/api/store-owner-applications', storeOwnerApplicationsRouter);
app.use('/api/admin/store-owner-applications', adminStoreOwnerApplicationsRouter);
app.use('/api/admin/store-owners', storeOwnersRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`StoreDash API listening on port ${env.port} (${env.nodeEnv})`);
});
