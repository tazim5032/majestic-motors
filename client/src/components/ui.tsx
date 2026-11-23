import { useEffect, type ReactNode } from 'react';
import type { DeliveryStatus, PaymentStatus } from '../lib/types';

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-zinc-500" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      {label}…
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-zinc-100 text-zinc-500">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 13h18M5 13l2-6h10l2 6M6 17h.01M18 17h.01M4 13v5h16v-5" /></svg>
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-sm text-zinc-500">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>;
}

const PAYMENT: Record<PaymentStatus, string> = {
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  pending: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  failed: 'bg-red-50 text-red-700 ring-red-200',
  cancelled: 'bg-zinc-100 text-zinc-500 ring-zinc-200',
};
export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${PAYMENT[status]}`}>{status}</span>;
}

export function DeliveryBadge({ status }: { status: DeliveryStatus }) {
  const dot = status === 'Delivered' ? 'bg-emerald-500' : status === 'Shipped' ? 'bg-zinc-900' : status === 'Processing' ? 'bg-zinc-500' : 'bg-zinc-300';
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-inset ring-zinc-200">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{status}
    </span>
  );
}

export function StockBadge({ quantity }: { quantity: number }) {
  if (quantity <= 0) return <span className="text-xs font-medium text-red-700">Out of stock</span>;
  if (quantity <= 2) return <span className="text-xs font-medium text-zinc-900">Only {quantity} left</span>;
  return <span className="text-xs font-medium text-zinc-500">{quantity} in stock</span>;
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-zinc-900/40 p-0 sm:items-center sm:p-6" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`card max-h-[92vh] w-full overflow-y-auto rounded-b-none sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}>
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button className="btn-ghost -mr-2 px-2 py-1" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

/** Vertical order tracking timeline. */
export function Timeline({ events }: { events: { status: string; at: string; note?: string }[] }) {
  return (
    <ol className="relative ml-2 border-l border-zinc-200">
      {events.map((e, i) => (
        <li key={i} className="mb-5 ml-5 last:mb-0">
          <span className={`absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full ${i === events.length - 1 ? 'bg-zinc-900' : 'bg-zinc-300'}`} />
          <p className="text-sm font-medium text-zinc-900">{e.status}</p>
          <p className="text-xs text-zinc-500">{new Date(e.at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}{e.note ? ` · ${e.note}` : ''}</p>
        </li>
      ))}
    </ol>
  );
}
