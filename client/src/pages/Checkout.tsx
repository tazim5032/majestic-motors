import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, money } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Car, Order } from '../lib/types';
import { CarVisual } from '../components/CarArt';
import { Empty, ErrorNote, Spinner } from '../components/ui';

export default function Checkout() {
  const { carId } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [car, setCar] = useState<Car | null>(null);
  const [loadError, setLoadError] = useState('');
  const [qty, setQty] = useState(Math.max(1, Number(params.get('qty')) || 1));
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ car: Car }>(`/cars/${carId}`).then(r => { setCar(r.car); setQty(q => Math.min(q, Math.max(1, Math.min(5, r.car.quantity)))); }).catch(e => setLoadError(e.message));
  }, [carId]);

  if (loadError) return <div className="container-x py-16"><Empty title="Car not available" action={<Link to="/cars" className="btn-outline">Back to inventory</Link>}>{loadError}</Empty></div>;
  if (!car || !user) return <Spinner label="Preparing checkout" />;

  const max = Math.min(5, car.quantity);
  const subtotal = car.price * qty;

  async function placeOrder(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const r = await api<{ order: Order; paymentUrl: string }>('/orders', { method: 'POST', body: { carId: car!.id, quantity: qty, phone, address } });
      navigate(r.paymentUrl);
    } catch (err) { setError((err as Error).message); setBusy(false); }
  }

  return (
    <div className="container-x py-10">
      <Link to={`/cars/${car.id}`} className="text-sm text-zinc-500 hover:text-zinc-900">← Back to car</Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <form className="card space-y-6 p-6 sm:p-8" onSubmit={placeOrder} id="checkout-form">
          {error && <ErrorNote message={error} />}
          <section>
            <h2 className="text-base font-semibold">Contact</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><label className="label">Name</label><input className="input bg-zinc-50" value={user.name} readOnly /></div>
              <div><label className="label">Email</label><input className="input bg-zinc-50" value={user.email} readOnly /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="phone">Phone</label><input id="phone" className="input" required minLength={6} autoComplete="tel" placeholder="+880 1XXX-XXXXXX" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            </div>
          </section>
          <section>
            <h2 className="text-base font-semibold">Delivery address</h2>
            <textarea id="address" className="input mt-4 min-h-[96px]" required minLength={8} autoComplete="street-address" placeholder="House, road, area, city" value={address} onChange={e => setAddress(e.target.value)} aria-label="Delivery address" />
          </section>
          <section>
            <h2 className="text-base font-semibold">Payment method</h2>
            <div className="mt-4 flex items-center gap-4 rounded-xl border-2 border-zinc-900 p-4">
              <span className="grid h-10 w-14 place-items-center rounded-md bg-zinc-900 text-xs font-bold text-white">SP</span>
              <div>
                <p className="text-sm font-semibold">SurjoPay</p>
                <p className="text-xs text-zinc-500">Cards and mobile banking. This demo uses a simulated sandbox; no real payment is taken.</p>
              </div>
            </div>
          </section>
        </form>

        <aside className="card h-fit p-6 lg:sticky lg:top-24">
          <h2 className="text-base font-semibold">Order summary</h2>
          <div className="mt-4 flex gap-4">
            <CarVisual car={car} size="sm" className="h-16 w-24 flex-none rounded-lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{car.brand} {car.name}</p>
              <p className="text-xs text-zinc-500">{car.year} · {car.category}</p>
              <p className="mt-1 text-sm tabular-nums">{money(car.price)}</p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm text-zinc-600">Quantity</span>
            <div className="flex items-center rounded-lg border border-zinc-300">
              <button type="button" className="px-3 py-1.5 disabled:opacity-30" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease">−</button>
              <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
              <button type="button" className="px-3 py-1.5 disabled:opacity-30" onClick={() => setQty(q => Math.min(max, q + 1))} disabled={qty >= max} aria-label="Increase">+</button>
            </div>
          </div>
          <dl className="mt-5 space-y-2 border-t border-zinc-100 pt-5 text-sm">
            <div className="flex justify-between"><dt className="text-zinc-600">Subtotal</dt><dd className="tabular-nums">{money(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-600">Delivery</dt><dd>Free</dd></div>
            <div className="flex justify-between border-t border-zinc-100 pt-3 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{money(subtotal)}</dd></div>
          </dl>
          <button form="checkout-form" className="btn-primary mt-6 w-full py-3" disabled={busy || car.quantity <= 0}>
            {car.quantity <= 0 ? 'Out of stock' : busy ? 'Creating order…' : 'Continue to payment'}
          </button>
          <p className="mt-3 text-center text-xs text-zinc-500">Stock is checked again before payment completes.</p>
        </aside>
      </div>
    </div>
  );
}
