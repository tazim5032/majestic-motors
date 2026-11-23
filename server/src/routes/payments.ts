// Simulated SurjoPay gateway. No real money moves: the client shows a sandbox
// payment screen and reports the outcome the shopper picks.
import { Router } from 'express';
import { z } from 'zod';
import { getDB, save } from '../db';
import { auth, HttpError, wrap } from '../http';

const router = Router();

function findPayment(paymentId: string, userId: string) {
  const order = getDB().orders.find(o => o.paymentId === paymentId);
  if (!order || order.userId !== userId) throw new HttpError(404, 'Payment session not found.');
  return order;
}

router.get('/:paymentId', auth(), wrap((req, res) => {
  res.json({ order: findPayment(String(req.params.paymentId), req.user!.id) });
}));

const completeSchema = z.object({ outcome: z.enum(['success', 'failed', 'cancelled']) });

router.post('/:paymentId/complete', auth(), wrap((req, res) => {
  const { outcome } = completeSchema.parse(req.body);
  const order = findPayment(String(req.params.paymentId), req.user!.id);
  if (order.paymentStatus !== 'pending') return res.json({ order }); // already settled: idempotent
  const now = new Date().toISOString();
  if (outcome === 'success') {
    const car = getDB().cars.find(c => c.id === order.carId);
    if (!car || car.quantity < order.quantity) {
      order.paymentStatus = 'failed';
      order.history.push({ status: 'Payment failed', at: now, note: 'The car sold out before payment completed.' });
    } else {
      car.quantity -= order.quantity;
      order.paymentStatus = 'paid';
      order.paidAt = now;
      const eta = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
      order.estimatedDelivery = eta;
      order.history.push({ status: 'Payment received via SurjoPay', at: now });
    }
  } else {
    order.paymentStatus = outcome;
    order.history.push({ status: outcome === 'failed' ? 'Payment failed' : 'Payment cancelled', at: now });
  }
  save();
  res.json({ order });
}));

export default router;
