export type Role = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isBlocked: boolean;
  phone?: string;
  address?: string;
  createdAt: string;
}

export const CATEGORIES = ['Sedan', 'SUV', 'Truck', 'Hatchback', 'Sports', 'Electric', 'Luxury'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Car {
  id: string;
  name: string;
  brand: string;
  year: number;
  category: Category;
  price: number;
  quantity: number;
  description: string;
  image?: string;
  color: string;
  fuel: string;
  transmission: string;
  mileage: string;
  seats: number;
  horsepower: number;
  featured: boolean;
  createdAt: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';
export const DELIVERY_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered'] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export interface OrderEvent {
  status: string;
  at: string;
  note?: string;
}

export interface Order {
  id: string;
  userId: string;
  customer: { name: string; email: string; phone: string; address: string };
  carId: string;
  carName: string;
  carBrand: string;
  carColor: string;
  carCategory: Category;
  unitPrice: number;
  quantity: number;
  total: number;
  paymentMethod: 'SurjoPay';
  paymentId: string;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  estimatedDelivery?: string;
  history: OrderEvent[];
  createdAt: string;
  paidAt?: string;
}

export interface DB {
  users: User[];
  cars: Car[];
  orders: Order[];
}

export type PublicUser = Omit<User, 'passwordHash'>;
