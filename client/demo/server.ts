// Live demo entry: runs the real API routes in the browser (see vite.config.ts aliases).
import { Router, dispatchTo } from './express-shim';
import { errorHandler, HttpError } from '../../server/src/http';
import { loadDB, resetDB, DEMO_DB_KEY } from './db';
import authRoutes from '../../server/src/routes/auth';
import carsRoutes from '../../server/src/routes/cars';
import ordersRoutes from '../../server/src/routes/orders';
import paymentsRoutes from '../../server/src/routes/payments';
import usersRoutes from '../../server/src/routes/users';
import statsRoutes from '../../server/src/routes/stats';

const app = Router();
app.use('/api/auth', authRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api', (_req: unknown, _res: unknown, next: (e?: unknown) => void) => next(new HttpError(404, 'Endpoint not found.')));
app.use(errorHandler);

export function dispatch(method: string, url: string, headers: Record<string, string>, body: unknown) {
  loadDB();
  return dispatchTo(app, method, url, headers, body);
}
export { resetDB, DEMO_DB_KEY };
