import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getDB, save } from '../db';
import { auth, HttpError, publicUser, wrap } from '../http';

const router = Router();

const profileSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(200).optional(),
});

router.patch('/me', auth(), wrap((req, res) => {
  const body = profileSchema.parse(req.body);
  Object.assign(req.user!, body);
  save();
  res.json({ user: publicUser(req.user!) });
}));

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(100),
});

router.post('/me/password', auth(), wrap((req, res) => {
  const body = passwordSchema.parse(req.body);
  const user = req.user!;
  if (!bcrypt.compareSync(body.currentPassword, user.passwordHash)) throw new HttpError(400, 'Your current password is incorrect.');
  if (body.currentPassword === body.newPassword) throw new HttpError(400, 'Choose a password different from the current one.');
  user.passwordHash = bcrypt.hashSync(body.newPassword, 10);
  save();
  res.json({ ok: true });
}));

// Admin: list users with order counts and spend.
router.get('/', auth('admin'), wrap((_req, res) => {
  const { users, orders } = getDB();
  res.json({
    users: users.map(u => {
      const mine = orders.filter(o => o.userId === u.id && o.paymentStatus === 'paid');
      return { ...publicUser(u), orders: mine.length, spent: mine.reduce((s, o) => s + o.total, 0) };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}));

router.patch('/:id', auth('admin'), wrap((req, res) => {
  const { isBlocked } = z.object({ isBlocked: z.boolean() }).parse(req.body);
  const user = getDB().users.find(u => u.id === req.params.id);
  if (!user) throw new HttpError(404, 'User not found.');
  if (user.role === 'admin') throw new HttpError(400, 'Admin accounts cannot be deactivated here.');
  user.isBlocked = isBlocked;
  save();
  res.json({ user: publicUser(user) });
}));

export default router;
