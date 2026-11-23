import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { Car, DB, Order, User } from './types';

// Demo accounts for local testing. The login page has one-click buttons for these.
export const DEMO_ACCOUNTS = {
  admin: { name: 'Admin Demo', email: 'admin@majesticmotors.test', password: 'AdminDemo#2026' },
  user: { name: 'Rahim Uddin', email: 'user@majesticmotors.test', password: 'UserDemo#2026' },
};

const id = () => crypto.randomUUID();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

type CarSeed = Omit<Car, 'id' | 'createdAt'>;

const cars: CarSeed[] = [
  { name: 'Camry XSE', brand: 'Toyota', year: 2025, category: 'Sedan', price: 34990, quantity: 7, color: '#9aa3ad', fuel: 'Hybrid', transmission: 'Automatic', mileage: '51 mpg', seats: 5, horsepower: 225, featured: true,
    description: 'A refined midsize sedan with a hybrid powertrain, sporty XSE styling and a quiet, comfortable cabin built for daily commutes and long trips.' },
  { name: 'Model 3 Long Range', brand: 'Tesla', year: 2025, category: 'Electric', price: 47490, quantity: 5, color: '#e5e7eb', fuel: 'Electric', transmission: 'Single-speed', mileage: '363 mi range', seats: 5, horsepower: 394, featured: true,
    description: 'All-wheel-drive electric sedan with long range, quick acceleration, a minimalist interior and over-the-air software updates.' },
  { name: 'RAV4 Adventure', brand: 'Toyota', year: 2024, category: 'SUV', price: 36850, quantity: 9, color: '#5b6b5e', fuel: 'Petrol', transmission: 'Automatic', mileage: '27 mpg', seats: 5, horsepower: 203, featured: false,
    description: 'Compact SUV with all-wheel drive, generous cargo space and rugged Adventure trim for weekend getaways.' },
  { name: 'F-150 Lariat', brand: 'Ford', year: 2024, category: 'Truck', price: 62300, quantity: 4, color: '#1f2a44', fuel: 'Petrol', transmission: '10-speed automatic', mileage: '20 mpg', seats: 5, horsepower: 400, featured: true,
    description: 'Full-size pickup with a powerful V8, premium Lariat interior, smart towing tech and a payload ready for real work.' },
  { name: 'Civic Hatchback Sport', brand: 'Honda', year: 2025, category: 'Hatchback', price: 27150, quantity: 12, color: '#b91c1c', fuel: 'Petrol', transmission: 'CVT', mileage: '36 mpg', seats: 5, horsepower: 180, featured: false,
    description: 'Practical, fun-to-drive hatchback with sharp handling, a flexible cargo area and Honda reliability.' },
  { name: '911 Carrera', brand: 'Porsche', year: 2024, category: 'Sports', price: 116950, quantity: 2, color: '#111827', fuel: 'Petrol', transmission: '8-speed PDK', mileage: '20 mpg', seats: 4, horsepower: 379, featured: true,
    description: 'The iconic rear-engine sports car: precise steering, a twin-turbo flat-six and everyday usability.' },
  { name: 'S-Class S 580', brand: 'Mercedes-Benz', year: 2025, category: 'Luxury', price: 131300, quantity: 2, color: '#0f172a', fuel: 'Petrol', transmission: '9-speed automatic', mileage: '21 mpg', seats: 5, horsepower: 496, featured: true,
    description: 'Flagship luxury sedan with a whisper-quiet cabin, massaging seats, advanced driver assistance and effortless V8 power.' },
  { name: 'Ioniq 5 SEL', brand: 'Hyundai', year: 2025, category: 'Electric', price: 46850, quantity: 6, color: '#a3a89c', fuel: 'Electric', transmission: 'Single-speed', mileage: '303 mi range', seats: 5, horsepower: 225, featured: false,
    description: 'Retro-modern electric crossover with ultra-fast charging, a spacious flat floor and vehicle-to-load power.' },
  { name: 'X5 xDrive40i', brand: 'BMW', year: 2024, category: 'SUV', price: 67600, quantity: 3, color: '#334155', fuel: 'Petrol', transmission: '8-speed automatic', mileage: '25 mpg', seats: 5, horsepower: 375, featured: true,
    description: 'Midsize luxury SUV that blends a smooth inline-six, sharp handling and a high-tech, premium cabin.' },
  { name: 'Mustang GT', brand: 'Ford', year: 2025, category: 'Sports', price: 44090, quantity: 4, color: '#c2410c', fuel: 'Petrol', transmission: '6-speed manual', mileage: '18 mpg', seats: 4, horsepower: 480, featured: false,
    description: 'American muscle with a naturally aspirated V8, a manual gearbox and a modern digital cockpit.' },
  { name: 'Accord EX-L', brand: 'Honda', year: 2024, category: 'Sedan', price: 33290, quantity: 8, color: '#6b7280', fuel: 'Hybrid', transmission: 'e-CVT', mileage: '44 mpg', seats: 5, horsepower: 204, featured: false,
    description: 'Spacious, efficient sedan with a premium-feeling interior and a smooth hybrid system.' },
  { name: 'Tacoma TRD Off-Road', brand: 'Toyota', year: 2024, category: 'Truck', price: 41900, quantity: 0, color: '#78716c', fuel: 'Petrol', transmission: 'Automatic', mileage: '21 mpg', seats: 5, horsepower: 278, featured: false,
    description: 'Midsize pickup tuned for trails, with off-road suspension, skid plates and crawl control.' },
  { name: 'Golf GTI', brand: 'Volkswagen', year: 2024, category: 'Hatchback', price: 32900, quantity: 5, color: '#e5e7eb', fuel: 'Petrol', transmission: '7-speed DSG', mileage: '28 mpg', seats: 5, horsepower: 241, featured: false,
    description: 'The original hot hatch: practical, playful and quick, with a turbocharged engine and sport-tuned chassis.' },
  { name: 'Range Rover Sport', brand: 'Land Rover', year: 2025, category: 'Luxury', price: 84350, quantity: 3, color: '#3f3f46', fuel: 'Mild hybrid', transmission: '8-speed automatic', mileage: '21 mpg', seats: 5, horsepower: 395, featured: false,
    description: 'Luxury performance SUV with go-anywhere capability, adaptive air suspension and a refined cabin.' },
  { name: 'Model Y Performance', brand: 'Tesla', year: 2025, category: 'Electric', price: 51490, quantity: 7, color: '#1e3a8a', fuel: 'Electric', transmission: 'Single-speed', mileage: '279 mi range', seats: 5, horsepower: 456, featured: false,
    description: 'Electric crossover with dual motors, flexible seating, a large glass roof and access to a fast-charging network.' },
  { name: 'CR-V Sport Touring', brand: 'Honda', year: 2025, category: 'SUV', price: 40450, quantity: 10, color: '#475569', fuel: 'Hybrid', transmission: 'e-CVT', mileage: '37 mpg', seats: 5, horsepower: 204, featured: false,
    description: 'Comfortable, efficient family SUV with a roomy rear seat, big cargo area and refined hybrid drive.' },
];

export function buildSeed(): DB {
  const now = new Date().toISOString();
  const users: User[] = [
    { id: id(), name: DEMO_ACCOUNTS.admin.name, email: DEMO_ACCOUNTS.admin.email, passwordHash: bcrypt.hashSync(DEMO_ACCOUNTS.admin.password, 10), role: 'admin', isBlocked: false, createdAt: daysAgo(200) },
    { id: id(), name: DEMO_ACCOUNTS.user.name, email: DEMO_ACCOUNTS.user.email, passwordHash: bcrypt.hashSync(DEMO_ACCOUNTS.user.password, 10), role: 'user', isBlocked: false, phone: '+880 1700-000000', address: 'House 12, Road 5, Dhanmondi, Dhaka', createdAt: daysAgo(160) },
    { id: id(), name: 'Nadia Karim', email: 'nadia@example.test', passwordHash: bcrypt.hashSync(crypto.randomBytes(12).toString('hex'), 10), role: 'user', isBlocked: false, address: 'Agrabad, Chattogram', createdAt: daysAgo(120) },
    { id: id(), name: 'Imran Hossain', email: 'imran@example.test', passwordHash: bcrypt.hashSync(crypto.randomBytes(12).toString('hex'), 10), role: 'user', isBlocked: false, address: 'Zindabazar, Sylhet', createdAt: daysAgo(90) },
    { id: id(), name: 'Sadia Rahman', email: 'sadia@example.test', passwordHash: bcrypt.hashSync(crypto.randomBytes(12).toString('hex'), 10), role: 'user', isBlocked: true, address: 'Shaheb Bazar, Rajshahi', createdAt: daysAgo(60) },
  ];
  const carRows: Car[] = cars.map((c, i) => ({ ...c, id: id(), createdAt: daysAgo(180 - i * 5) }));

  // Sample order history spread over the last ~6 months so dashboards have data.
  const buyers = users.filter(u => u.role === 'user');
  const plan: [number, number, Order['deliveryStatus'], Order['paymentStatus']][] = [
    // [carIndex, daysAgo, delivery, payment]
    [0, 170, 'Delivered', 'paid'], [4, 150, 'Delivered', 'paid'], [2, 140, 'Delivered', 'paid'],
    [10, 118, 'Delivered', 'paid'], [1, 105, 'Delivered', 'paid'], [12, 96, 'Delivered', 'paid'],
    [15, 80, 'Delivered', 'paid'], [8, 66, 'Delivered', 'paid'], [7, 52, 'Delivered', 'paid'],
    [3, 40, 'Shipped', 'paid'], [9, 26, 'Shipped', 'paid'], [14, 14, 'Processing', 'paid'],
    [1, 6, 'Processing', 'paid'], [5, 3, 'Pending', 'paid'], [4, 2, 'Pending', 'failed'], [13, 1, 'Pending', 'cancelled'],
  ];
  const orders: Order[] = plan.map(([ci, ago, delivery, payment], i) => {
    const car = carRows[ci];
    const buyer = buyers[i % buyers.length];
    const created = daysAgo(ago);
    const history: Order['history'] = [{ status: 'Order placed', at: created }];
    if (payment === 'paid') history.push({ status: 'Payment received via SurjoPay', at: created });
    if (payment === 'failed') history.push({ status: 'Payment failed', at: created });
    if (payment === 'cancelled') history.push({ status: 'Payment cancelled', at: created });
    const steps: Order['deliveryStatus'][] = ['Processing', 'Shipped', 'Delivered'];
    steps.slice(0, steps.indexOf(delivery as never) + 1).forEach((s, k) =>
      history.push({ status: s, at: daysAgo(Math.max(ago - (k + 1) * 3, 0)) }));
    return {
      id: id(), userId: buyer.id,
      customer: { name: buyer.name, email: buyer.email, phone: buyer.phone ?? '+880 1800-000000', address: buyer.address ?? 'Dhaka' },
      carId: car.id, carName: car.name, carBrand: car.brand, carColor: car.color, carCategory: car.category,
      unitPrice: car.price, quantity: 1, total: car.price, paymentMethod: 'SurjoPay',
      paymentId: 'SP' + crypto.randomBytes(5).toString('hex').toUpperCase(),
      paymentStatus: payment, deliveryStatus: delivery,
      estimatedDelivery: payment === 'paid' ? daysAgo(ago - 10).slice(0, 10) : undefined,
      history, createdAt: created, paidAt: payment === 'paid' ? created : undefined,
    };
  });

  void now;
  return { users, cars: carRows, orders };
}
