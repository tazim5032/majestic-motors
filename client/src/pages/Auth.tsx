import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DEMO, useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { CarIllustration } from '../components/CarArt';
import { ErrorNote } from '../components/ui';
import type { User } from '../lib/types';

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="container-x grid min-h-[calc(100vh-4rem)] items-center gap-12 py-12 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
      <div className="hidden rounded-3xl bg-zinc-900 p-12 text-white lg:block">
        <CarIllustration category="Luxury" color="#e4e4e7" className="w-full" />
        <p className="mt-8 text-2xl font-semibold tracking-tight">Your next car is a few clicks away.</p>
        <p className="mt-2 text-zinc-400">Track every order from payment to delivery in one dashboard.</p>
      </div>
    </div>
  );
}

const homeFor = (u: User) => (u.role === 'admin' ? '/dashboard/admin' : '/dashboard/user');

export function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function doLogin(e: string, p: string) {
    setBusy(true); setError('');
    try {
      const u = await login(e, p);
      toast(`Welcome back, ${u.name.split(' ')[0]}!`);
      navigate(from && !(u.role === 'admin' && from.startsWith('/checkout')) ? from : homeFor(u), { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <Shell title="Log in" subtitle="Welcome back. Log in to check out and track your orders.">
      <form className="space-y-4" onSubmit={(e: FormEvent) => { e.preventDefault(); doLogin(email, password); }}>
        {error && <ErrorNote message={error} />}
        <div><label className="label" htmlFor="email">Email</label><input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div><label className="label" htmlFor="password">Password</label><input id="password" className="input" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
        <button className="btn-primary w-full py-3" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
      <div className="mt-6 rounded-xl border border-dashed border-zinc-300 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Try the demo</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="btn-outline py-2" disabled={busy} onClick={() => doLogin(DEMO.user.email, DEMO.user.password)}>Customer demo</button>
          <button className="btn-outline py-2" disabled={busy} onClick={() => doLogin(DEMO.admin.email, DEMO.admin.password)}>Admin demo</button>
        </div>
      </div>
      <p className="mt-6 text-sm text-zinc-500">New here? <Link to="/register" state={{ from }} className="font-medium text-zinc-900 underline underline-offset-4">Create an account</Link></p>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setBusy(true); setError('');
    try {
      const u = await register(form.name, form.email, form.password);
      toast('Account created. Welcome to Majestic Motors!');
      navigate(from ?? homeFor(u), { replace: true });
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <Shell title="Create your account" subtitle="It takes less than a minute.">
      <form className="space-y-4" onSubmit={submit}>
        {error && <ErrorNote message={error} />}
        <div><label className="label" htmlFor="name">Full name</label><input id="name" className="input" autoComplete="name" required value={form.name} onChange={set('name')} /></div>
        <div><label className="label" htmlFor="remail">Email</label><input id="remail" className="input" type="email" autoComplete="email" required value={form.email} onChange={set('email')} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="rpass">Password</label><input id="rpass" className="input" type="password" autoComplete="new-password" minLength={8} required value={form.password} onChange={set('password')} /></div>
          <div><label className="label" htmlFor="rconfirm">Confirm</label><input id="rconfirm" className="input" type="password" autoComplete="new-password" minLength={8} required value={form.confirm} onChange={set('confirm')} /></div>
        </div>
        <p className="text-xs text-zinc-500">At least 8 characters.</p>
        <button className="btn-primary w-full py-3" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="mt-6 text-sm text-zinc-500">Already have an account? <Link to="/login" state={{ from }} className="font-medium text-zinc-900 underline underline-offset-4">Log in</Link></p>
    </Shell>
  );
}
