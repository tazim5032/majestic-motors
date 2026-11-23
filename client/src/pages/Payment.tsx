// Simulated SurjoPay sandbox. The shopper chooses the outcome so every path
// (success, failure, cancellation) can be demonstrated. No real payment happens.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, date, money, shortId } from '../lib/api';
import type { Order } from '../lib/types';
import { Empty, Spinner } from '../components/ui';

type Outcome = 'success' | 'failed' | 'cancelled';

export default function Payment() {
  const { paymentId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<Outcome | null>(null);
  const [method, setMethod] = useState<'card' | 'mobile'>('card');

  useEffect(() => {
    api<{ order: Order }>(`/payments/${paymentId}`).then(r => setOrder(r.order)).catch(e => setError(e.message));
  }, [paymentId]);

  async function complete(outcome: Outcome) {
    setBusy(outcome);
    if (outcome === 'success') await new Promise(r => setTimeout(r, 900)); // feel of a real gateway
    try {
      const r = await api<{ order: Order }>(`/payments/${paymentId}/complete`, { method: 'POST', body: { outcome } });
      setOrder(r.order);
    } catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }

  if (error) return <div className="container-x py-16"><Empty title="Payment unavailable" action={<Link to="/dashboard" className="btn-outline">Go to dashboard</Link>}>{error}</Empty></div>;
  if (!order) return <Spinner label="Connecting to SurjoPay" />;

  if (order.paymentStatus !== 'pending') return <Result order={order} />;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-100 py-12">
      <div className="mx-auto max-w-md px-4">
        <div className="mb-3 rounded-lg bg-zinc-900 px-3 py-2 text-center text-xs font-medium text-zinc-200">Sandbox mode · simulated payment, no money is charged</div>
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-zinc-900 text-[11px] font-bold text-white">SP</span>
              <span className="font-semibold">SurjoPay</span>
            </div>
            <span className="text-xs text-zinc-500">Secure checkout</span>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs text-zinc-500">Paying Majestic Motors</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{money(order.total)}</p>
            <p className="mt-1 text-xs text-zinc-500">{order.quantity} × {order.carBrand} {order.carName} · Ref {order.paymentId}</p>

            <div className="mt-6 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Payment method">
              {(['card', 'mobile'] as const).map(m => (
                <button key={m} role="radio" aria-checked={method === m} onClick={() => setMethod(m)}
                  className={`rounded-xl border-2 px-3 py-3 text-sm font-medium transition ${method === m ? 'border-zinc-900' : 'border-zinc-200 text-zinc-500 hover:border-zinc-400'}`}>
                  {m === 'card' ? 'Card' : 'Mobile banking'}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {method === 'card' ? (
                <>
                  <input className="input font-mono" value="4242 4242 4242 4242" readOnly aria-label="Test card number" />
                  <div className="grid grid-cols-2 gap-3">
                    <input className="input font-mono" value="12 / 30" readOnly aria-label="Test expiry" />
                    <input className="input font-mono" value="123" readOnly aria-label="Test CVC" />
                  </div>
                </>
              ) : (
                <input className="input font-mono" value="01XXXXXXXXX (sandbox wallet)" readOnly aria-label="Test wallet" />
              )}
              <p className="text-xs text-zinc-500">Sandbox values are prefilled. Choose an outcome below to simulate the gateway response.</p>
            </div>

            <button className="btn-primary mt-6 w-full py-3" disabled={!!busy} onClick={() => complete('success')}>
              {busy === 'success' ? 'Processing payment…' : `Pay ${money(order.total)}`}
            </button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button className="btn-outline py-2 text-xs" disabled={!!busy} onClick={() => complete('failed')}>Simulate failure</button>
              <button className="btn-ghost py-2 text-xs" disabled={!!busy} onClick={() => complete('cancelled')}>Cancel payment</button>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-zinc-500">Order #{shortId(order.id)}</p>
      </div>
    </div>
  );
}

function Result({ order }: { order: Order }) {
  const ok = order.paymentStatus === 'paid';
  const title = ok ? 'Payment successful' : order.paymentStatus === 'failed' ? 'Payment failed' : 'Payment cancelled';
  const text = ok
    ? `Thank you! Your ${order.carBrand} ${order.carName} is confirmed. Estimated delivery: ${order.estimatedDelivery ? date(order.estimatedDelivery) : 'to be scheduled'}.`
    : order.history.at(-1)?.note ?? 'No money was taken. You can try again from the car page.';
  return (
    <div className="container-x flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="card w-full max-w-md p-8 text-center">
        <div className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${ok ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-600'}`}>
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d={ok ? 'M5 12l5 5 9-10' : 'M6 6l12 12M18 6L6 18'} /></svg>
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-zinc-600">{text}</p>
        <dl className="mt-6 space-y-2 rounded-xl bg-zinc-50 p-4 text-left text-sm">
          <div className="flex justify-between"><dt className="text-zinc-500">Order</dt><dd className="font-mono">#{shortId(order.id)}</dd></div>
          <div className="flex justify-between"><dt className="text-zinc-500">Payment ref</dt><dd className="font-mono">{order.paymentId}</dd></div>
          <div className="flex justify-between"><dt className="text-zinc-500">Amount</dt><dd className="font-semibold tabular-nums">{money(order.total)}</dd></div>
        </dl>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link to="/dashboard/user/orders" className="btn-primary flex-1">{ok ? 'Track my order' : 'View my orders'}</Link>
          <Link to={ok ? '/cars' : `/cars/${order.carId}`} className="btn-outline flex-1">{ok ? 'Keep browsing' : 'Try again'}</Link>
        </div>
      </div>
    </div>
  );
}
