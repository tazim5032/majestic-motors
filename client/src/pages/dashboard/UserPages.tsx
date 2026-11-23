import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, date, money, shortId } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../lib/toast';
import type { Order, User } from '../../lib/types';
import { CarIllustration } from '../../components/CarArt';
import { DeliveryBadge, Empty, ErrorNote, PageTitle, PaymentBadge, Spinner, StatCard, Timeline } from '../../components/ui';

function useMyOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api<{ orders: Order[] }>('/orders/mine').then(r => setOrders(r.orders)).catch(e => setError(e.message)); }, []);
  return { orders, error };
}

export function UserOverview() {
  const { user } = useAuth();
  const { orders, error } = useMyOrders();
  if (error) return <ErrorNote message={error} />;
  if (!orders) return <Spinner />;
  const paid = orders.filter(o => o.paymentStatus === 'paid');
  const active = paid.filter(o => o.deliveryStatus !== 'Delivered');
  const latest = active[0] ?? paid[0];

  return (
    <>
      <PageTitle title={`Hi, ${user?.name.split(' ')[0]}`} subtitle="Here's what's happening with your orders." action={<Link to="/cars" className="btn-primary">Browse cars</Link>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Orders placed" value={orders.length} hint={`${paid.length} paid`} />
        <StatCard label="On the way" value={active.length} hint="Processing or shipped" />
        <StatCard label="Total spent" value={money(paid.reduce((s, o) => s + o.total, 0))} />
      </div>
      {latest ? (
        <div className="card mt-6 grid gap-6 p-6 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="eyebrow">{active.length ? 'Current delivery' : 'Latest order'}</p>
            <CarIllustration category={latest.carCategory} color={latest.carColor} className="mt-3 w-full max-w-xs" />
            <h2 className="mt-2 text-lg font-semibold">{latest.carBrand} {latest.carName}</h2>
            <p className="text-sm text-zinc-500">Order #{shortId(latest.id)} · {money(latest.total)}</p>
            <div className="mt-3 flex gap-2"><PaymentBadge status={latest.paymentStatus} /><DeliveryBadge status={latest.deliveryStatus} /></div>
            {latest.estimatedDelivery && latest.deliveryStatus !== 'Delivered' && <p className="mt-3 text-sm">Estimated delivery: <b>{date(latest.estimatedDelivery)}</b></p>}
          </div>
          <div><p className="mb-4 text-sm font-semibold">Tracking</p><Timeline events={latest.history} /></div>
        </div>
      ) : (
        <div className="mt-6"><Empty title="No orders yet" action={<Link to="/cars" className="btn-primary">Find a car</Link>}>When you buy a car, you'll track it here.</Empty></div>
      )}
    </>
  );
}

export function MyOrders() {
  const { orders, error } = useMyOrders();
  const [open, setOpen] = useState<string | null>(null);
  if (error) return <ErrorNote message={error} />;
  if (!orders) return <Spinner />;
  return (
    <>
      <PageTitle title="My orders" subtitle="Payment and delivery status for every order." />
      {orders.length === 0 ? (
        <Empty title="No orders yet" action={<Link to="/cars" className="btn-primary">Find a car</Link>}>Orders you place will appear here.</Empty>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="card overflow-hidden">
              <button className="flex w-full flex-wrap items-center gap-4 p-4 text-left sm:flex-nowrap" onClick={() => setOpen(open === o.id ? null : o.id)} aria-expanded={open === o.id}>
                <div className="h-14 w-20 flex-none rounded-lg bg-zinc-100 p-1"><CarIllustration category={o.carCategory} color={o.carColor} className="h-full w-full" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{o.carBrand} {o.carName}{o.quantity > 1 ? ` × ${o.quantity}` : ''}</p>
                  <p className="text-xs text-zinc-500">#{shortId(o.id)} · {date(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2"><PaymentBadge status={o.paymentStatus} />{o.paymentStatus === 'paid' && <DeliveryBadge status={o.deliveryStatus} />}</div>
                <p className="w-28 text-right text-sm font-semibold tabular-nums">{money(o.total)}</p>
                <span className="text-zinc-400">{open === o.id ? '▴' : '▾'}</span>
              </button>
              {open === o.id && (
                <div className="grid gap-6 border-t border-zinc-100 bg-zinc-50/60 p-5 md:grid-cols-2">
                  <div className="space-y-1 text-sm">
                    <p><span className="text-zinc-500">Payment ref:</span> <span className="font-mono">{o.paymentId}</span></p>
                    <p><span className="text-zinc-500">Deliver to:</span> {o.customer.address}</p>
                    <p><span className="text-zinc-500">Phone:</span> {o.customer.phone}</p>
                    {o.estimatedDelivery && <p><span className="text-zinc-500">Estimated delivery:</span> {date(o.estimatedDelivery)}</p>}
                    {o.paymentStatus === 'pending' && <Link to={`/pay/${o.paymentId}`} className="btn-primary mt-3">Complete payment</Link>}
                  </div>
                  <Timeline events={o.history} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '', address: user?.address ?? '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [err, setErr] = useState({ profile: '', pw: '' });
  const [busy, setBusy] = useState<'profile' | 'pw' | null>(null);

  async function saveProfile(e: FormEvent) {
    e.preventDefault(); setBusy('profile'); setErr(x => ({ ...x, profile: '' }));
    try { const r = await api<{ user: User }>('/users/me', { method: 'PATCH', body: form }); setUser(r.user); toast('Profile saved.'); }
    catch (e2) { setErr(x => ({ ...x, profile: (e2 as Error).message })); } finally { setBusy(null); }
  }
  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return setErr(x => ({ ...x, pw: 'New passwords do not match.' }));
    setBusy('pw'); setErr(x => ({ ...x, pw: '' }));
    try { await api('/users/me/password', { method: 'POST', body: { currentPassword: pw.currentPassword, newPassword: pw.newPassword } }); setPw({ currentPassword: '', newPassword: '', confirm: '' }); toast('Password updated.'); }
    catch (e2) { setErr(x => ({ ...x, pw: (e2 as Error).message })); } finally { setBusy(null); }
  }

  return (
    <>
      <PageTitle title="Profile & security" subtitle={`Signed in as ${user?.email}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <form className="card space-y-4 p-6" onSubmit={saveProfile}>
          <h2 className="text-base font-semibold">Personal details</h2>
          {err.profile && <ErrorNote message={err.profile} />}
          <div><label className="label" htmlFor="p-name">Full name</label><input id="p-name" className="input" required minLength={2} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label" htmlFor="p-phone">Phone</label><input id="p-phone" className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label" htmlFor="p-address">Default delivery address</label><textarea id="p-address" className="input min-h-[80px]" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <button className="btn-primary" disabled={busy === 'profile'}>{busy === 'profile' ? 'Saving…' : 'Save changes'}</button>
        </form>
        <form className="card h-fit space-y-4 p-6" onSubmit={changePassword}>
          <h2 className="text-base font-semibold">Change password</h2>
          {err.pw && <ErrorNote message={err.pw} />}
          <div><label className="label" htmlFor="pw-cur">Current password</label><input id="pw-cur" type="password" autoComplete="current-password" className="input" required value={pw.currentPassword} onChange={e => setPw({ ...pw, currentPassword: e.target.value })} /></div>
          <div><label className="label" htmlFor="pw-new">New password</label><input id="pw-new" type="password" autoComplete="new-password" minLength={8} className="input" required value={pw.newPassword} onChange={e => setPw({ ...pw, newPassword: e.target.value })} /></div>
          <div><label className="label" htmlFor="pw-conf">Confirm new password</label><input id="pw-conf" type="password" autoComplete="new-password" minLength={8} className="input" required value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} /></div>
          <button className="btn-outline" disabled={busy === 'pw'}>{busy === 'pw' ? 'Updating…' : 'Update password'}</button>
        </form>
      </div>
    </>
  );
}
