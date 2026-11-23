import express from 'express';
import cors from 'cors';
import { loadDB } from './db';
import { errorHandler, HttpError } from './http';
import authRoutes from './routes/auth';
import carRoutes from './routes/cars';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import userRoutes from './routes/users';
import statsRoutes from './routes/stats';

loadDB();

const app = express();
app.use(cors({ origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/] }));
app.use(express.json({ limit: '200kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Endpoint not found.')));
app.use(errorHandler);

const port = Number(process.env.PORT ?? 5050);
app.listen(port, '127.0.0.1', () => console.log(`Majestic Motors API on http://localhost:${port}`));
