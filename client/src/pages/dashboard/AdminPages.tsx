import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, compactMoney, date, money, shortId } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { CATEGORIES, DELIVERY_STATUSES, type Car, type CarList, type DeliveryStatus, type Order, type User } from '../../lib/types';
import { CarIllustration, CarVisual } from '../../components/CarArt';
import { DeliveryBadge, Empty, ErrorNote, Modal, PageTitle, PaymentBadge, Spinner, StatCard, StockBadge, Timeline } from '../../components/ui';

/* ---------------- Overview ---------------- */

interface Stats {
  totals: { revenue: number; orders: number; paidOrders: number; customers: number; cars: number; unitsInStock: number };
  months: { label: string; revenue: number; orders: number }[];
  byCategory: { category: string; revenue: number }[];
  deliveryPipeline: { status: string; count: number }[];
  lowStock: { id: string; brand: string; name: string; quantity: number }[];
  recentOrders: Order[];
}

function RevenueChart({ months }: { months: Stats['months'] }) {
  const max = Math.max(1, ...months.map(m => m.revenue));
  const W = 560, H = 200, pad = 28, bw = (W - pad * 2) / months.length;
  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full" role="img" aria-label="Revenue for the last six months">
      {[0, 0.5, 1].map(t => (
        <g key={t}>
          <line x1={pad} x2={W - pad} y1={H - t * (H - 20)} y2={H - t * (H - 20)} stroke="#e4e4e7" strokeDasharray={t ? '3 4' : undefined} />
          {t > 0 && <text x={pad - 6} y={H - t * (H - 20) + 4} textAnchor="end" fontSize="10" fill="#a1a1aa">{compactMoney(max * t)}</text>}
        </g>
      ))}
      {months.map((m, i) => {
        const h = (m.revenue / max) * (H - 20);
        const x = pad + i * bw + bw * 0.22;
        return (
          <g key={m.label + i}>
            <rect x={x} y={H - h} width={bw * 0.56} height={Math.max(h, 1)} rx="5" fill={i === months.length - 1 ? '#18181b' : '#a1a1aa'}>
              <title>{`${m.label}: ${money(m.revenue)} from ${m.orders} orders`}</title>
            </rect>
            {m.revenue > 0 && <text x={x + bw * 0.28} y={H - h - 6} textAnchor="middle" fontSize="10" fill="#52525b">{compactMoney(m.revenue)}</text>}
            <text x={x + bw * 0.28} y={H + 18} textAnchor="middle" fontSize="11" fill="#71717a">{m.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function AdminOverview() {
  const [s, setS] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api<Stats>('/stats/admin').then(setS).catch(e => setError(e.message)); }, []);
  if (error) return <ErrorNote message={error} />;
  if (!s) return <Spinner />;
  const topCat = Math.max(1, ...s.byCategory.map(c => c.revenue));
  const pipeTotal = Math.max(1, s.deliveryPipeline.reduce((a, b) => a + b.count, 0));

  return (
    <>
      <PageTitle title="Store overview" subtitle="Sales, inventory and deliveries at a glance." action={<Link to="/dashboard/admin/cars" className="btn-primary">Manage inventory</Link>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue (paid)" value={money(s.totals.revenue)} hint={`${s.totals.paidOrders} paid orders`} />
        <StatCard label="All orders" value={s.totals.orders} hint={`${s.totals.orders - s.totals.paidOrders} unpaid / failed / cancelled`} />
        <StatCard label="Customers" value={s.totals.customers} />
        <StatCard label="Models listed" value={s.totals.cars} hint={`${s.totals.unitsInStock} units in stock`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="card p-6">
          <div className="flex items-baseline justify-between"><h2 className="text-base font-semibold">Revenue, last 6 months</h2><span className="text-xs text-zinc-500">Paid orders only</span></div>
          <div className="mt-4"><RevenueChart months={s.months} /></div>
        </div>
        <div className="card p-6">
          <h2 className="text-base font-semibold">Revenue by body type</h2>
          <ul className="mt-5 space-y-3">
            {s.byCategory.map(c => (
              <li key={c.category}>
                <div className="flex justify-between text-sm"><span>{c.category}</span><span className="tabular-nums text-zinc-600">{money(c.revenue)}</span></div>
                <div className="mt-1.5 h-2 rounded-full bg-zinc-100"><div className="h-2 rounded-full bg-zinc-900" style={{ width: `${(c.revenue / topCat) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4"><h2 className="text-base font-semibold">Recent orders</h2><Link to="/dashboard/admin/orders" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">View all →</Link></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <tbody className="divide-y divide-zinc-100 border-t border-zinc-100">
                {s.recentOrders.map(o => (
                  <tr key={o.id}>
                    <td className="table-td"><p className="font-medium text-zinc-900">{o.carBrand} {o.carName}</p><p className="text-xs text-zinc-500">{o.customer.name} · {date(o.createdAt)}</p></td>
                    <td className="table-td"><PaymentBadge status={o.paymentStatus} /></td>
                    <td className="table-td">{o.paymentStatus === 'paid' ? <DeliveryBadge status={o.deliveryStatus} /> : <span className="text-xs text-zinc-400">—</span>}</td>
                    <td className="table-td text-right font-medium tabular-nums">{money(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold">Delivery pipeline</h2>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-zinc-100">
              {s.deliveryPipeline.map((p, i) => <div key={p.status} style={{ width: `${(p.count / pipeTotal) * 100}%`, background: ['#d4d4d8', '#a1a1aa', '#52525b', '#18181b'][i] }} title={`${p.status}: ${p.count}`} />)}
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {s.deliveryPipeline.map((p, i) => (
                <li key={p.status} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: ['#d4d4d8', '#a1a1aa', '#52525b', '#18181b'][i] }} />{p.status}<span className="ml-auto tabular-nums text-zinc-500">{p.count}</span></li>
              ))}
            </ul>
          </div>
          <div className="card p-6">
            <h2 className="text-base font-semibold">Low stock</h2>
            {s.lowStock.length === 0 ? <p className="mt-3 text-sm text-zinc-500">Everything is well stocked.</p> : (
              <ul className="mt-3 divide-y divide-zinc-100">
                {s.lowStock.map(c => <li key={c.id} className="flex justify-between py-2 text-sm"><span>{c.brand} {c.name}</span><StockBadge quantity={c.quantity} /></li>)}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- Inventory (cars CRUD) ---------------- */

type CarForm = Omit<Car, 'id' | 'createdAt' | 'image'> & { image: string };
const blankCar: CarForm = { name: '', brand: '', year: new Date().getFullYear(), category: 'Sedan', price: 30000, quantity: 1, description: '', image: '', color: '#71717a', fuel: 'Petrol', transmission: 'Automatic', mileage: '', seats: 5, horsepower: 200, featured: false };

function CarEditor({ initial, onSaved, onCancel }: { initial?: Car; onSaved: () => void; onCancel: () => void }) {
  const toast = useToast();
  const [f, setF] = useState<CarForm>(initial ? { ...initial, image: initial.image ?? '' } : blankCar);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof CarForm>(k: K, v: CarForm[K]) => setF(x => ({ ...x, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (initial) await api(`/cars/${initial.id}`, { method: 'PATCH', body: f });
      else await api('/cars', { method: 'POST', body: f });
      toast(initial ? 'Car updated.' : 'Car added to inventory.');
      onSaved();
    } catch (err) { setError((err as Error).message); setBusy(false); }
  }

  const text = (k: keyof CarForm, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div><label className="label" htmlFor={`c-${k}`}>{label}</label>
      <input id={`c-${k}`} className="input" value={String(f[k])} onChange={e => set(k, (props.type === 'number' ? Number(e.target.value) : e.target.value) as never)} {...props} /></div>
  );

  return (
    <form className="space-y-5" onSubmit={submit}>
      {error && <ErrorNote message={error} />}
      <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {text('brand', 'Brand', { required: true })}
          {text('name', 'Model name', { required: true })}
          <div><label className="label" htmlFor="c-category">Body type</label>
            <select id="c-category" className="input" value={f.category} onChange={e => set('category', e.target.value as CarForm['category'])}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
          {text('year', 'Year', { type: 'number', min: 1990, required: true })}
          {text('price', 'Price (USD)', { type: 'number', min: 1, step: 10, required: true })}
          {text('quantity', 'Units in stock', { type: 'number', min: 0, required: true })}
        </div>
        <div>
          <span className="label">Preview</span>
          <CarVisual car={{ ...f, image: f.image || undefined }} size="sm" className="aspect-[16/10] rounded-xl" />
          <label className="label mt-3" htmlFor="c-color">Paint colour</label>
          <div className="flex gap-2"><input id="c-color" type="color" className="h-10 w-12 cursor-pointer rounded-lg border border-zinc-300 bg-white p-1" value={f.color} onChange={e => set('color', e.target.value)} /><input className="input font-mono" value={f.color} onChange={e => set('color', e.target.value)} aria-label="Colour hex" /></div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {text('fuel', 'Fuel', { required: true })}
        {text('transmission', 'Transmission', { required: true })}
        {text('mileage', 'Economy / range', { required: true, placeholder: '35 mpg' })}
        {text('horsepower', 'Horsepower', { type: 'number', min: 1, required: true })}
        {text('seats', 'Seats', { type: 'number', min: 1, max: 12, required: true })}
        {text('image', 'Photo URL (optional)', { type: 'url', placeholder: 'https://…' })}
      </div>
      <div><label className="label" htmlFor="c-desc">Description</label><textarea id="c-desc" className="input min-h-[90px]" required minLength={10} value={f.description} onChange={e => set('description', e.target.value)} /></div>
      <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" className="h-4 w-4 accent-zinc-900" checked={f.featured} onChange={e => set('featured', e.target.checked)} />Feature on the home page</label>
      <div className="flex justify-end gap-2 border-t border-zinc-100 pt-5">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Add car'}</button>
      </div>
    </form>
  );
}

export function AdminCars() {
  const toast = useToast();
  const [cars, setCars] = useState<Car[] | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Car | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Car | null>(null);

  const load = useCallback(() => api<CarList>('/cars', { query: { limit: 100, sort: 'name' } }).then(r => setCars(r.items)).catch(e => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => (cars ?? []).filter(c => `${c.brand} ${c.name} ${c.category}`.toLowerCase().includes(q.toLowerCase())), [cars, q]);

  async function remove() {
    if (!deleting) return;
    try { await api(`/cars/${deleting.id}`, { method: 'DELETE' }); toast('Car removed from inventory.'); setDeleting(null); load(); }
    catch (e) { toast((e as Error).message, 'error'); }
  }

  return (
    <>
      <PageTitle title="Inventory" subtitle={cars ? `${cars.length} models · ${cars.reduce((s, c) => s + c.quantity, 0)} units in stock` : undefined}
        action={<button className="btn-primary" onClick={() => setEditing('new')}>+ Add car</button>} />
      <input className="input mb-4 max-w-sm" type="search" placeholder="Search inventory…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search inventory" />
      {error && <ErrorNote message={error} />}
      {!cars ? <Spinner /> : shown.length === 0 ? <Empty title="No cars found" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-zinc-200 bg-zinc-50"><tr><th className="table-th">Car</th><th className="table-th">Type</th><th className="table-th text-right">Price</th><th className="table-th">Stock</th><th className="table-th">Featured</th><th className="table-th text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {shown.map(c => (
                <tr key={c.id} className="hover:bg-zinc-50/60">
                  <td className="table-td"><div className="flex items-center gap-3"><CarVisual car={c} size="sm" className="h-10 w-16 flex-none rounded-md" /><div><Link to={`/cars/${c.id}`} className="font-medium text-zinc-900 hover:underline">{c.brand} {c.name}</Link><p className="text-xs text-zinc-500">{c.year} · {c.fuel}</p></div></div></td>
                  <td className="table-td">{c.category}</td>
                  <td className="table-td text-right tabular-nums">{money(c.price)}</td>
                  <td className="table-td"><StockBadge quantity={c.quantity} /></td>
                  <td className="table-td">{c.featured ? 'Yes' : <span className="text-zinc-400">No</span>}</td>
                  <td className="table-td text-right"><button className="btn-ghost px-3 py-1.5" onClick={() => setEditing(c)}>Edit</button><button className="btn-ghost px-3 py-1.5 text-red-700 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleting(c)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add a car' : 'Edit car'} wide>
        {editing !== null && <CarEditor initial={editing === 'new' ? undefined : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      </Modal>
      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete car?">
        <p className="text-sm text-zinc-600">Remove <b>{deleting?.brand} {deleting?.name}</b> from the inventory? Existing orders keep their details. This can't be undone.</p>
        <div className="mt-6 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setDeleting(null)}>Keep it</button><button className="btn-danger" onClick={remove}>Delete car</button></div>
      </Modal>
    </>
  );
}

/* ---------------- Orders ---------------- */

function OrderManager({ order, onSaved }: { order: Order; onSaved: (o: Order) => void }) {
  const toast = useToast();
  const [status, setStatus] = useState<DeliveryStatus>(order.deliveryStatus);
  const [eta, setEta] = useState(order.estimatedDelivery ?? '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const paid = order.paymentStatus === 'paid';

  async function save(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const r = await api<{ order: Order }>(`/orders/${order.id}`, { method: 'PATCH', body: { ...(paid ? { deliveryStatus: status } : {}), estimatedDelivery: eta, note } });
      toast('Order updated.'); onSaved(r.order); setNote('');
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <div className="flex items-center gap-3"><div className="h-12 w-20 rounded-lg bg-zinc-100 p-1"><CarIllustration category={order.carCategory} color={order.carColor} className="h-full w-full" /></div>
          <div><p className="font-semibold">{order.carBrand} {order.carName}</p><p className="text-xs text-zinc-500">{order.quantity} × {money(order.unitPrice)} = <b>{money(order.total)}</b></p></div></div>
        <dl className="mt-5 space-y-1.5 text-sm">
          <div><dt className="inline text-zinc-500">Customer: </dt><dd className="inline">{order.customer.name} ({order.customer.email})</dd></div>
          <div><dt className="inline text-zinc-500">Phone: </dt><dd className="inline">{order.customer.phone}</dd></div>
          <div><dt className="inline text-zinc-500">Address: </dt><dd className="inline">{order.customer.address}</dd></div>
          <div><dt className="inline text-zinc-500">Payment: </dt><dd className="inline"><PaymentBadge status={order.paymentStatus} /> <span className="font-mono text-xs">{order.paymentId}</span></dd></div>
        </dl>
        <form className="mt-6 space-y-4 border-t border-zinc-100 pt-5" onSubmit={save}>
          {error && <ErrorNote message={error} />}
          <div><label className="label" htmlFor="o-status">Delivery status</label>
            <select id="o-status" className="input" value={status} disabled={!paid} onChange={e => setStatus(e.target.value as DeliveryStatus)}>{DELIVERY_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
            {!paid && <p className="mt-1 text-xs text-zinc-500">Delivery can be updated once the order is paid.</p>}</div>
          <div><label className="label" htmlFor="o-eta">Estimated delivery</label><input id="o-eta" type="date" className="input" value={eta} onChange={e => setEta(e.target.value)} /></div>
          <div><label className="label" htmlFor="o-note">Note for the customer (optional)</label><input id="o-note" className="input" maxLength={200} placeholder="e.g. Left the warehouse in Dhaka" value={note} onChange={e => setNote(e.target.value)} /></div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save update'}</button>
        </form>
      </div>
      <div><p className="mb-4 text-sm font-semibold">Order history</p><Timeline events={order.history} /></div>
    </div>
  );
}

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Order | null>(null);
  useEffect(() => { api<{ orders: Order[] }>('/orders').then(r => setOrders(r.orders)).catch(e => setError(e.message)); }, []);

  const shown = useMemo(() => (orders ?? []).filter(o =>
    (!filter || o.deliveryStatus === filter || o.paymentStatus === filter) &&
    `${o.customer.name} ${o.customer.email} ${o.carBrand} ${o.carName} ${o.id} ${o.paymentId}`.toLowerCase().includes(q.toLowerCase())), [orders, filter, q]);

  const tabs = [['', 'All'], ['pending', 'Awaiting payment'], ['Pending', 'To process'], ['Processing', 'Processing'], ['Shipped', 'Shipped'], ['Delivered', 'Delivered']];

  return (
    <>
      <PageTitle title="Orders" subtitle="Update delivery status and estimated delivery dates." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tabs.map(([v, l]) => <button key={l} onClick={() => setFilter(v)} className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${filter === v ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:text-zinc-900'}`}>{l}</button>)}
        <input className="input ml-auto w-full sm:w-64" type="search" placeholder="Search customer, car, ref…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search orders" />
      </div>
      {error && <ErrorNote message={error} />}
      {!orders ? <Spinner /> : shown.length === 0 ? <Empty title="No orders here" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="border-b border-zinc-200 bg-zinc-50"><tr><th className="table-th">Order</th><th className="table-th">Customer</th><th className="table-th">Car</th><th className="table-th">Payment</th><th className="table-th">Delivery</th><th className="table-th">ETA</th><th className="table-th text-right">Total</th></tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {shown.map(o => (
                <tr key={o.id} className="cursor-pointer hover:bg-zinc-50/60" onClick={() => setOpen(o)}>
                  <td className="table-td"><span className="font-mono text-xs text-zinc-900">#{shortId(o.id)}</span><p className="text-xs text-zinc-500">{date(o.createdAt)}</p></td>
                  <td className="table-td"><p className="text-zinc-900">{o.customer.name}</p><p className="text-xs text-zinc-500">{o.customer.email}</p></td>
                  <td className="table-td">{o.carBrand} {o.carName}{o.quantity > 1 ? ` × ${o.quantity}` : ''}</td>
                  <td className="table-td"><PaymentBadge status={o.paymentStatus} /></td>
                  <td className="table-td">{o.paymentStatus === 'paid' ? <DeliveryBadge status={o.deliveryStatus} /> : <span className="text-xs text-zinc-400">—</span>}</td>
                  <td className="table-td text-xs">{o.estimatedDelivery ? date(o.estimatedDelivery) : '—'}</td>
                  <td className="table-td text-right font-medium tabular-nums">{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open !== null} onClose={() => setOpen(null)} title={open ? `Order #${shortId(open.id)}` : ''} wide>
        {open && <OrderManager order={open} onSaved={o => { setOpen(o); setOrders(list => list?.map(x => (x.id === o.id ? o : x)) ?? null); }} />}
      </Modal>
    </>
  );
}

/* ---------------- Customers ---------------- */

type AdminUser = User & { orders: number; spent: number };

export function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const load = useCallback(() => api<{ users: AdminUser[] }>('/users').then(r => setUsers(r.users)).catch(e => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  async function toggle(u: AdminUser) {
    try { await api(`/users/${u.id}`, { method: 'PATCH', body: { isBlocked: !u.isBlocked } }); toast(u.isBlocked ? `${u.name} reactivated.` : `${u.name} deactivated.`); load(); }
    catch (e) { toast((e as Error).message, 'error'); }
  }

  const shown = (users ?? []).filter(u => `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageTitle title="Customers" subtitle="Deactivated accounts can't log in or place orders." />
      <input className="input mb-4 max-w-sm" type="search" placeholder="Search name or email…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search customers" />
      {error && <ErrorNote message={error} />}
      {!users ? <Spinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-zinc-200 bg-zinc-50"><tr><th className="table-th">Name</th><th className="table-th">Role</th><th className="table-th">Joined</th><th className="table-th text-right">Paid orders</th><th className="table-th text-right">Spent</th><th className="table-th">Status</th><th className="table-th text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {shown.map(u => (
                <tr key={u.id}>
                  <td className="table-td"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 text-xs font-semibold">{u.name.charAt(0)}</span><div><p className="font-medium text-zinc-900">{u.name}</p><p className="text-xs text-zinc-500">{u.email}</p></div></div></td>
                  <td className="table-td capitalize">{u.role}</td>
                  <td className="table-td text-xs">{date(u.createdAt)}</td>
                  <td className="table-td text-right tabular-nums">{u.orders}</td>
                  <td className="table-td text-right tabular-nums">{money(u.spent)}</td>
                  <td className="table-td">{u.isBlocked ? <span className="text-xs font-medium text-red-700">Deactivated</span> : <span className="text-xs font-medium text-zinc-600">Active</span>}</td>
                  <td className="table-td text-right">{u.role === 'admin' ? <span className="text-xs text-zinc-400">—</span> : <button className={u.isBlocked ? 'btn-outline px-3 py-1.5' : 'btn-danger px-3 py-1.5'} onClick={() => toggle(u)}>{u.isBlocked ? 'Reactivate' : 'Deactivate'}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
