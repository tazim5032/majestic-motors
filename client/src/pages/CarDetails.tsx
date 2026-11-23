import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, money } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Car } from '../lib/types';
import { CarVisual } from '../components/CarArt';
import { CarCard } from '../components/CarCard';
import { Empty, Spinner, StockBadge } from '../components/ui';

export default function CarDetails() {
  const { id } = useParams();
  const [data, setData] = useState<{ car: Car; related: Car[] } | null>(null);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setData(null); setError(''); setQty(1);
    api<{ car: Car; related: Car[] }>(`/cars/${id}`).then(setData).catch(e => setError(e.message));
  }, [id]);

  if (error) return <div className="container-x py-16"><Empty title="Car not found" action={<Link to="/cars" className="btn-outline">Back to inventory</Link>}>{error}</Empty></div>;
  if (!data) return <Spinner label="Loading car" />;
  const { car, related } = data;
  const max = Math.min(5, car.quantity);

  const buy = () => {
    const to = `/checkout/${car.id}?qty=${qty}`;
    if (!user) navigate('/login', { state: { from: to } });
    else navigate(to);
  };

  const specs = [
    ['Body type', car.category], ['Model year', car.year], ['Fuel', car.fuel], ['Transmission', car.transmission],
    ['Power', `${car.horsepower} hp`], ['Economy / range', car.mileage], ['Seats', car.seats],
  ];

  return (
    <div className="container-x py-10">
      <nav className="text-sm text-zinc-500" aria-label="Breadcrumb">
        <Link to="/cars" className="hover:text-zinc-900">Inventory</Link> <span className="mx-1.5">/</span>
        <Link to={`/cars?category=${car.category}`} className="hover:text-zinc-900">{car.category}</Link> <span className="mx-1.5">/</span>
        <span className="text-zinc-900">{car.brand} {car.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.25fr_1fr]">
        <div className="card overflow-hidden">
          <CarVisual car={car} size="lg" className="aspect-[16/10]" />
        </div>

        <div>
          <p className="eyebrow">{car.brand}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{car.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">{car.year} · {car.category} · {car.fuel}</p>
          <p className="mt-6 text-3xl font-semibold tabular-nums">{money(car.price)}</p>
          <div className="mt-1"><StockBadge quantity={car.quantity} /></div>
          <p className="mt-6 leading-relaxed text-zinc-600">{car.description}</p>

          <div className="mt-8 flex flex-wrap items-end gap-3">
            <div>
              <label className="label" htmlFor="qty">Quantity</label>
              <div className="flex items-center rounded-lg border border-zinc-300 bg-white">
                <button className="px-3 py-2.5 text-zinc-600 disabled:opacity-30" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease">−</button>
                <input id="qty" className="w-10 border-0 bg-transparent text-center text-sm font-medium tabular-nums focus:outline-none" value={qty} readOnly />
                <button className="px-3 py-2.5 text-zinc-600 disabled:opacity-30" onClick={() => setQty(q => Math.min(max, q + 1))} disabled={qty >= max} aria-label="Increase">+</button>
              </div>
            </div>
            <button className="btn-primary flex-1 py-3" disabled={car.quantity <= 0} onClick={buy}>
              {car.quantity <= 0 ? 'Out of stock' : `Buy now · ${money(car.price * qty)}`}
            </button>
          </div>
          {user?.role === 'admin' && <p className="mt-3 text-xs text-zinc-500">You're signed in as an admin. Log in with a customer account to place orders.</p>}

          <ul className="mt-8 grid grid-cols-1 gap-2 text-sm text-zinc-600 sm:grid-cols-3">
            <li className="rounded-lg bg-zinc-100 px-3 py-2">Secure SurjoPay checkout</li>
            <li className="rounded-lg bg-zinc-100 px-3 py-2">Delivery in ~10 days</li>
            <li className="rounded-lg bg-zinc-100 px-3 py-2">Live order tracking</li>
          </ul>
        </div>
      </div>

      <section className="mt-14">
        <h2 className="text-lg font-semibold">Specifications</h2>
        <dl className="card mt-4 grid divide-y divide-zinc-100 sm:grid-cols-2 sm:divide-y-0">
          {specs.map(([k, v], i) => (
            <div key={k} className={`flex justify-between gap-4 px-5 py-3.5 text-sm ${i % 2 === 0 ? 'sm:border-r sm:border-zinc-100' : ''} ${i > 1 ? 'sm:border-t sm:border-zinc-100' : ''}`}>
              <dt className="text-zinc-500">{k}</dt><dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-lg font-semibold">You might also like</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{related.map(c => <CarCard key={c.id} car={c} />)}</div>
        </section>
      )}
    </div>
  );
}
