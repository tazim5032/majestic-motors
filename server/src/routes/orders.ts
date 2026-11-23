import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { getDB, newId, save } from '../db';
import { auth, HttpError, wrap } from '../http';
import { DELIVERY_STATUSES, type Order } from '../types';

const router = Router();

const createSchema = z.object({
  carId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(5, 'You can order up to 5 at a time'),
  phone: z.string().trim().min(6, 'Enter a valid phone number').max(30),
  address: z.string().trim().min(8, 'Enter your full delivery address').max(200),
});

// Step 1 of checkout: create a pending order and a simulated SurjoPay payment session.
router.post('/', auth('user'), wrap((req, res) => {
  const body = createSchema.parse(req.body);
  const db = getDB();
  const car = db.cars.find(c => c.id === body.carId);
  if (!car) throw new HttpError(404, 'This car is no longer available.');
  if (car.quantity < body.quantity) throw new HttpError(409, car.quantity ? `Only ${car.quantity} left in stock.` : 'This car is out of stock.');
  const user = req.user!;
  const now = new Date().toISOString();
  const order: Order = {
    id: newId(), userId: user.id,
    customer: { name: user.name, email: user.email, phone: body.phone, address: body.address },
    carId: car.id, carName: car.name, carBrand: car.brand, carColor: car.color, carCategory: car.category,
    unitPrice: car.price, quantity: body.quantity, total: car.price * body.quantity,
    paymentMethod: 'SurjoPay', paymentId: 'SP' + crypto.randomBytes(5).toString('hex').toUpperCase(),
    paymentStatus: 'pending', deliveryStatus: 'Pending',
    history: [{ status: 'Order placed', at: now, note: 'Awaiting payment' }], createdAt: now,
  };
  // Remember the delivery details on the profile for next time.
  user.phone = body.phone;
  user.address = body.address;
  db.orders.push(order);
  save();
  res.status(201).json({ order, paymentUrl: `/pay/${order.paymentId}` });
}));

router.get('/mine', auth(), wrap((req, res) => {
  const orders = getDB().orders.filter(o => o.userId === req.user!.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ orders });
}));

router.get('/', auth('admin'), wrap((req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  let orders = [...getDB().orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (status) orders = orders.filter(o => o.deliveryStatus === status || o.paymentStatus === status);
  res.json({ orders });
}));

router.get('/:id', auth(), wrap((req, res) => {
  const order = getDB().orders.find(o => o.id === req.params.id);
  if (!order || (req.user!.role !== 'admin' && order.userId !== req.user!.id)) throw new HttpError(404, 'Order not found.');
  res.json({ order });
}));

const updateSchema = z.object({
  deliveryStatus: z.enum(DELIVERY_STATUSES).optional(),
  estimatedDelivery: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date like 2026-12-31').or(z.literal('')).optional(),
  note: z.string().trim().max(200).optional(),
});

router.patch('/:id', auth('admin'), wrap((req, res) => {
  const order = getDB().orders.find(o => o.id === req.params.id);
  if (!order) throw new HttpError(404, 'Order not found.');
  const body = updateSchema.parse(req.body);
  if (body.deliveryStatus && order.paymentStatus !== 'paid') throw new HttpError(409, 'Only paid orders can move through delivery.');
  const now = new Date().toISOString();
  if (body.deliveryStatus && body.deliveryStatus !== order.deliveryStatus) {
    order.deliveryStatus = body.deliveryStatus;
    order.history.push({ status: body.deliveryStatus, at: now, note: body.note || undefined });
  } else if (body.note) {
    order.history.push({ status: 'Update', at: now, note: body.note });
  }
  if (body.estimatedDelivery !== undefined) order.estimatedDelivery = body.estimatedDelivery || undefined;
  save();
  res.json({ order });
}));

export default router;
