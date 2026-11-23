import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { CATEGORIES, type Car, type CarList } from '../lib/types';
import { CarCard, CarCardSkeleton } from '../components/CarCard';
import { CarIllustration } from '../components/CarArt';

const CATEGORY_COLORS: Record<string, string> = {
  Sedan: '#a1a1aa', SUV: '#71717a', Truck: '#52525b', Hatchback: '#d4d4d8', Sports: '#27272a', Electric: '#e4e4e7', Luxury: '#18181b',
};

export default function Home() {
  const [featured, setFeatured] = useState<Car[] | null>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api<CarList>('/cars', { query: { featured: 'true', limit: 6 } })
      .then(r => { setFeatured(r.items); setBrands(r.facets.brands); })
      .catch(() => setFeatured([]));
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-white">
        <div className="container-x grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="eyebrow">New cars · Doorstep delivery</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Find the car that fits your life.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-zinc-600">
              Compare sedans, SUVs, trucks and EVs from trusted brands. Transparent prices, secure checkout and live order tracking.
            </p>
            <form className="mt-8 flex max-w-lg gap-2" onSubmit={e => { e.preventDefault(); navigate(`/cars${q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ''}`); }}>
              <input className="input flex-1 py-3" placeholder="Search brand, model or type…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search cars" />
              <button className="btn-primary px-6">Search</button>
            </form>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-zinc-600">
              <span><b className="text-zinc-900">16+</b> models in stock</span>
              <span><b className="text-zinc-900">10-day</b> delivery</span>
              <span><b className="text-zinc-900">Secure</b> SurjoPay checkout</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-x-6 bottom-6 top-10 rounded-[2rem] bg-gradient-to-b from-zinc-100 to-zinc-200" />
            <CarIllustration category="Sports" color="#27272a" className="relative w-full drop-shadow-xl" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-x py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Browse by type</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">What are you looking for?</h2>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {CATEGORIES.map(c => (
            <Link key={c} to={`/cars?category=${c}`} className="card group flex flex-col items-center px-3 pb-4 pt-2 transition hover:border-zinc-400">
              <CarIllustration category={c} color={CATEGORY_COLORS[c]} className="w-full transition group-hover:scale-105" />
              <span className="text-sm font-medium">{c}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Featured</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Popular right now</h2>
          </div>
          <Link to="/cars" className="btn-outline">View all cars →</Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured === null ? Array.from({ length: 6 }, (_, i) => <CarCardSkeleton key={i} />) : featured.map(c => <CarCard key={c.id} car={c} />)}
        </div>
      </section>

      {/* Brands */}
      {brands.length > 0 && (
        <section className="container-x pt-20">
          <p className="eyebrow text-center">Brands we carry</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {brands.map(b => (
              <Link key={b} to={`/cars?brand=${encodeURIComponent(b)}`} className="rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900">{b}</Link>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="container-x pt-20">
        <div className="card grid gap-px overflow-hidden bg-zinc-200 md:grid-cols-3">
          {[
            ['01', 'Pick your car', 'Filter by type, brand, price and availability. Every listing shows live stock.'],
            ['02', 'Check out securely', 'Confirm delivery details and pay through SurjoPay. No hidden fees.'],
            ['03', 'Track to your door', 'Follow your order from processing to delivery in your dashboard.'],
          ].map(([n, t, d]) => (
            <div key={n} className="bg-white p-8">
              <span className="font-mono text-xs text-zinc-400">{n}</span>
              <h3 className="mt-3 text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container-x pt-20">
        <p className="eyebrow">Customer stories</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Drivers who bought with us</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            ['The checkout took five minutes and I could see exactly where my RAV4 was until it arrived.', 'Nadia K.', 'Chattogram'],
            ['Clear prices, honest stock levels and the dashboard made tracking easy. Would buy again.', 'Imran H.', 'Sylhet'],
            ['I compared three EVs side by side and ordered the one that fit my commute. Smooth experience.', 'Rahim U.', 'Dhaka'],
          ].map(([quote, name, city]) => (
            <figure key={name} className="card p-6">
              <blockquote className="text-sm leading-relaxed text-zinc-700">“{quote}”</blockquote>
              <figcaption className="mt-4 text-sm"><b className="font-semibold">{name}</b> <span className="text-zinc-500">· {city}</span></figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-400">Sample testimonials for this demo.</p>
      </section>

      {/* CTA */}
      <section className="container-x pt-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-zinc-900 px-8 py-12 text-white md:flex-row md:items-center md:px-12">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ready for your next drive?</h2>
            <p className="mt-2 text-zinc-400">Create an account to check out and track your orders.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/cars" className="btn bg-white text-zinc-900 hover:bg-zinc-200">Browse inventory</Link>
            <Link to="/register" className="btn border border-zinc-700 text-white hover:border-white">Sign up</Link>
          </div>
        </div>
      </section>
    </>
  );
}
