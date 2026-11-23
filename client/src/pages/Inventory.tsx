import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, money } from '../lib/api';
import { CATEGORIES, type CarList } from '../lib/types';
import { CarCard, CarCardSkeleton } from '../components/CarCard';
import { Empty, ErrorNote } from '../components/ui';

const SORTS = [
  ['newest', 'Newest listings'], ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low'],
  ['year-desc', 'Model year'], ['name', 'Name A–Z'],
] as const;

export default function Inventory() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<CarList | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [showFilters, setShowFilters] = useState(false);

  const query = useMemo(() => Object.fromEntries(params.entries()), [params]);

  useEffect(() => {
    setError('');
    const t = setTimeout(() => {
      api<CarList>('/cars', { query: { ...query, limit: 12 } }).then(setData).catch(e => setError(e.message));
    }, 120);
    return () => clearTimeout(t);
  }, [query]);

  // Debounce the search box into the URL.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('search') ?? '') !== search) update({ search: search || undefined, page: undefined });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function update(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  }

  const active = ['category', 'brand', 'minPrice', 'maxPrice', 'inStock', 'search'].filter(k => params.get(k));
  const page = Number(params.get('page') ?? 1);

  const filters = (
    <div className="space-y-6">
      <div>
        <label className="label" htmlFor="f-cat">Body type</label>
        <select id="f-cat" className="input" value={params.get('category') ?? ''} onChange={e => update({ category: e.target.value || undefined })}>
          <option value="">All types</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="f-brand">Brand</label>
        <select id="f-brand" className="input" value={params.get('brand') ?? ''} onChange={e => update({ brand: e.target.value || undefined })}>
          <option value="">All brands</option>
          {data?.facets.brands.map(b => <option key={b}>{b}</option>)}
        </select>
      </div>
      <div>
        <span className="label">Price (USD)</span>
        <div className="flex items-center gap-2">
          <input className="input" type="number" min={0} step={1000} placeholder={data ? String(data.facets.priceRange[0]) : 'Min'} aria-label="Minimum price"
            value={params.get('minPrice') ?? ''} onChange={e => update({ minPrice: e.target.value || undefined })} />
          <span className="text-zinc-400">–</span>
          <input className="input" type="number" min={0} step={1000} placeholder={data ? String(data.facets.priceRange[1]) : 'Max'} aria-label="Maximum price"
            value={params.get('maxPrice') ?? ''} onChange={e => update({ maxPrice: e.target.value || undefined })} />
        </div>
        {data && <p className="mt-1.5 text-xs text-zinc-500">Range {money(data.facets.priceRange[0])} – {money(data.facets.priceRange[1])}</p>}
      </div>
      <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-zinc-700">
        <input type="checkbox" className="h-4 w-4 rounded border-zinc-300 accent-zinc-900" checked={params.get('inStock') === 'true'} onChange={e => update({ inStock: e.target.checked ? 'true' : undefined })} />
        In stock only
      </label>
      {active.length > 0 && (
        <button className="btn-ghost w-full" onClick={() => { setSearch(''); setParams({}, { replace: true }); }}>Clear all filters</button>
      )}
    </div>
  );

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">All cars</h1>
          <p className="mt-1 text-sm text-zinc-500">{data ? `${data.total} ${data.total === 1 ? 'car' : 'cars'} found` : 'Loading inventory…'}</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <input className="input sm:w-72" type="search" placeholder="Search brand, model, type…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search cars" />
          <select className="input w-auto" value={params.get('sort') ?? 'newest'} onChange={e => update({ sort: e.target.value === 'newest' ? undefined : e.target.value })} aria-label="Sort">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button className="btn-outline lg:hidden" onClick={() => setShowFilters(s => !s)} aria-expanded={showFilters}>Filters{active.length ? ` (${active.length})` : ''}</button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className={`${showFilters ? 'block' : 'hidden'} card h-fit p-5 lg:sticky lg:top-24 lg:block`}>{filters}</aside>
        <div>
          {error && <ErrorNote message={error} />}
          {!data && !error && <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <CarCardSkeleton key={i} />)}</div>}
          {data && data.items.length === 0 && (
            <Empty title="No cars match your filters" action={<button className="btn-outline" onClick={() => { setSearch(''); setParams({}, { replace: true }); }}>Clear filters</button>}>
              Try a different body type, brand or price range.
            </Empty>
          )}
          {data && data.items.length > 0 && (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{data.items.map(c => <CarCard key={c.id} car={c} />)}</div>
              {data.pages > 1 && (
                <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
                  <button className="btn-outline" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>← Previous</button>
                  <span className="px-3 text-sm text-zinc-500">Page {data.page} of {data.pages}</span>
                  <button className="btn-outline" disabled={page >= data.pages} onClick={() => update({ page: String(page + 1) })}>Next →</button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
