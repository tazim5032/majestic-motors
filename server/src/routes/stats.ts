import { Router } from 'express';
import { getDB } from '../db';
import { auth, wrap } from '../http';

const router = Router();

router.get('/admin', auth('admin'), wrap((_req, res) => {
  const { users, cars, orders } = getDB();
  const paid = orders.filter(o => o.paymentStatus === 'paid');

  // Revenue for the last 6 calendar months (oldest first).
  const months: { key: string; label: string; revenue: number; orders: number }[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 5; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push({ key: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`, label: m.toLocaleString('en-US', { month: 'short' }), revenue: 0, orders: 0 });
  }
  for (const o of paid) {
    const slot = months.find(m => m.key === (o.paidAt ?? o.createdAt).slice(0, 7));
    if (slot) { slot.revenue += o.total; slot.orders += 1; }
  }

  const byCategory: Record<string, number> = {};
  for (const o of paid) byCategory[o.carCategory] = (byCategory[o.carCategory] ?? 0) + o.total;

  res.json({
    totals: {
      revenue: paid.reduce((s, o) => s + o.total, 0),
      orders: orders.length,
      paidOrders: paid.length,
      customers: users.filter(u => u.role === 'user').length,
      cars: cars.length,
      unitsInStock: cars.reduce((s, c) => s + c.quantity, 0),
    },
    months,
    byCategory: Object.entries(byCategory).map(([category, revenue]) => ({ category, revenue })).sort((a, b) => b.revenue - a.revenue),
    deliveryPipeline: ['Pending', 'Processing', 'Shipped', 'Delivered'].map(s => ({ status: s, count: paid.filter(o => o.deliveryStatus === s).length })),
    lowStock: cars.filter(c => c.quantity <= 2).sort((a, b) => a.quantity - b.quantity).map(c => ({ id: c.id, brand: c.brand, name: c.name, quantity: c.quantity })),
    recentOrders: [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
  });
}));

export default router;
