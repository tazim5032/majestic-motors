import { Router } from 'express';
import { z } from 'zod';
import { getDB, newId, save } from '../db';
import { auth, HttpError, wrap } from '../http';
import { CATEGORIES, type Car } from '../types';

const router = Router();

const listQuery = z.object({
  search: z.string().trim().optional(),
  category: z.enum(CATEGORIES).optional(),
  brand: z.string().trim().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.enum(['true', 'false']).optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort: z.enum(['newest', 'price-asc', 'price-desc', 'year-desc', 'name']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

router.get('/', wrap((req, res) => {
  const q = listQuery.parse(req.query);
  const all = getDB().cars;
  let items = all.filter(c => {
    if (q.search) {
      const hay = `${c.brand} ${c.name} ${c.category} ${c.year}`.toLowerCase();
      if (!q.search.toLowerCase().split(/\s+/).every(w => hay.includes(w))) return false;
    }
    if (q.category && c.category !== q.category) return false;
    if (q.brand && c.brand !== q.brand) return false;
    if (q.minPrice != null && c.price < q.minPrice) return false;
    if (q.maxPrice != null && c.price > q.maxPrice) return false;
    if (q.inStock === 'true' && c.quantity <= 0) return false;
    if (q.featured === 'true' && !c.featured) return false;
    return true;
  });
  const sorters: Record<typeof q.sort, (a: Car, b: Car) => number> = {
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    'year-desc': (a, b) => b.year - a.year,
    name: (a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`),
  };
  items = items.sort(sorters[q.sort]);
  const total = items.length;
  const start = (q.page - 1) * q.limit;
  res.json({
    items: items.slice(start, start + q.limit),
    total, page: q.page, pages: Math.max(1, Math.ceil(total / q.limit)),
    facets: {
      brands: [...new Set(all.map(c => c.brand))].sort(),
      categories: CATEGORIES,
      priceRange: all.length ? [Math.min(...all.map(c => c.price)), Math.max(...all.map(c => c.price))] : [0, 0],
    },
  });
}));

router.get('/:id', wrap((req, res) => {
  const car = getDB().cars.find(c => c.id === req.params.id);
  if (!car) throw new HttpError(404, 'Car not found.');
  const related = getDB().cars.filter(c => c.id !== car.id && (c.category === car.category || c.brand === car.brand)).slice(0, 3);
  res.json({ car, related });
}));

const carSchema = z.object({
  name: z.string().trim().min(1).max(80),
  brand: z.string().trim().min(1).max(40),
  year: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1),
  category: z.enum(CATEGORIES),
  price: z.coerce.number().positive().max(10_000_000),
  quantity: z.coerce.number().int().min(0).max(10_000),
  description: z.string().trim().min(10, 'Description should be at least 10 characters').max(2000),
  image: z.string().trim().url('Image must be a URL').or(z.literal('')).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #1f2937').default('#6b7280'),
  fuel: z.string().trim().min(1).max(30),
  transmission: z.string().trim().min(1).max(40),
  mileage: z.string().trim().min(1).max(30),
  seats: z.coerce.number().int().min(1).max(12),
  horsepower: z.coerce.number().int().min(1).max(2000),
  featured: z.boolean().default(false),
});

router.post('/', auth('admin'), wrap((req, res) => {
  const body = carSchema.parse(req.body);
  const car: Car = { ...body, image: body.image || undefined, id: newId(), createdAt: new Date().toISOString() };
  getDB().cars.push(car);
  save();
  res.status(201).json({ car });
}));

router.patch('/:id', auth('admin'), wrap((req, res) => {
  const car = getDB().cars.find(c => c.id === req.params.id);
  if (!car) throw new HttpError(404, 'Car not found.');
  const body = carSchema.partial().parse(req.body);
  Object.assign(car, body, { image: body.image === undefined ? car.image : body.image || undefined });
  save();
  res.json({ car });
}));

router.delete('/:id', auth('admin'), wrap((req, res) => {
  const db = getDB();
  const idx = db.cars.findIndex(c => c.id === req.params.id);
  if (idx === -1) throw new HttpError(404, 'Car not found.');
  db.cars.splice(idx, 1);
  save();
  res.json({ ok: true });
}));

export default router;
