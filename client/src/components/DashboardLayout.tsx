import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { Role } from '../lib/types';
import { Logo } from './Layout';
import { Spinner } from './ui';

const icons: Record<string, string> = {
  overview: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z',
  orders: 'M6 4h12l2 4v12H4V8zM4 8h16M9 12h6',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0',
  cars: 'M3 13h18M5 13l2-6h10l2 6M4 13v5h16v-5M7 17h.01M17 17h.01',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 3a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3',
};

const links: Record<Role, { to: string; label: string; icon: string; end?: boolean }[]> = {
  user: [
    { to: '/dashboard/user', label: 'Overview', icon: 'overview', end: true },
    { to: '/dashboard/user/orders', label: 'My orders', icon: 'orders' },
    { to: '/dashboard/user/profile', label: 'Profile & security', icon: 'profile' },
  ],
  admin: [
    { to: '/dashboard/admin', label: 'Overview', icon: 'overview', end: true },
    { to: '/dashboard/admin/cars', label: 'Inventory', icon: 'cars' },
    { to: '/dashboard/admin/orders', label: 'Orders', icon: 'orders' },
    { to: '/dashboard/admin/users', label: 'Customers', icon: 'users' },
    { to: '/dashboard/admin/profile', label: 'Profile & security', icon: 'profile' },
  ],
};

export function RequireAuth({ role, children }: { role?: Role; children: JSX.Element }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/dashboard/admin' : '/dashboard/user'} replace />;
  return children;
}

export function DashboardLayout({ role }: { role: Role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5"><Logo /></div>
      <p className="eyebrow px-5 pb-2 pt-4">{role === 'admin' ? 'Admin' : 'My account'}</p>
      <nav className="flex flex-col gap-0.5 px-3" aria-label="Dashboard">
        {links[role].map(l => (
          <NavLink key={l.to} to={l.to} end={l.end}
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}>
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icons[l.icon]} /></svg>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-zinc-200 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700">{user?.name.charAt(0)}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-zinc-500">{user?.email}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link to="/cars" className="btn-outline flex-1 px-3 py-2 text-xs">Shop</Link>
          <button className="btn-ghost flex-1 px-3 py-2 text-xs" onClick={() => { logout(); navigate('/'); }}>Log out</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-zinc-200 bg-white lg:block">{sidebar}</aside>
      {open && <div className="fixed inset-0 z-30 bg-zinc-900/30 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-200 bg-white transition-transform lg:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}>{sidebar}</aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-zinc-200 bg-white/85 px-4 backdrop-blur lg:hidden">
          <button className="btn-ghost px-2" onClick={() => setOpen(true)} aria-label="Open menu">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <span className="font-semibold">Dashboard</span>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10"><Outlet /></main>
      </div>
    </div>
  );
}
