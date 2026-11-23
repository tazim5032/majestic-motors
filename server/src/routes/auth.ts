import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getDB, newId, save } from '../db';
import { auth, HttpError, publicUser, signToken, wrap } from '../http';

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(60),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

router.post('/register', wrap((req, res) => {
  const body = registerSchema.parse(req.body);
  const db = getDB();
  if (db.users.some(u => u.email === body.email)) throw new HttpError(409, 'An account with this email already exists.');
  const user = {
    id: newId(), name: body.name, email: body.email,
    passwordHash: bcrypt.hashSync(body.password, 10),
    role: 'user' as const, isBlocked: false, createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  save();
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});

router.post('/login', wrap((req, res) => {
  const body = loginSchema.parse(req.body);
  const user = getDB().users.find(u => u.email === body.email);
  if (!user || !bcrypt.compareSync(body.password, user.passwordHash)) throw new HttpError(401, 'Incorrect email or password.');
  if (user.isBlocked) throw new HttpError(403, 'This account has been deactivated. Please contact support.');
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', auth(), wrap((req, res) => {
  res.json({ user: publicUser(req.user!) });
}));

export default router;
