import { useEffect, useState } from 'react';
import { IS_DEMO, resetDemoData } from '../lib/api';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function Logo({ light }: { light?: boolean }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 font-semibold tracking-tight ${light ? 'text-white' : 'text-zinc-900'}`}>
      <span className={`grid h-8 w-8 place-items-center rounded-lg text-sm font-bold ${light ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'}`}>M</span>
      Majestic Motors
    </Link>
  );
}

const nav = [
  { to: '/', label: 'Home', end: true },
  { to: '/cars', label: 'Inventory' },
  { to: '/about', label: 'About' },
];

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`;

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {nav.map(n => <NavLink key={n.to} to={n.to} end={n.end} className={linkCls}>{n.label}</NavLink>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link to="/dashboard" className="btn-outline py-2">Dashboard</Link>
              <button className="btn-ghost py-2" onClick={() => { logout(); navigate('/'); }}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost py-2">Log in</Link>
              <Link to="/register" className="btn-primary py-2">Create account</Link>
            </>
          )}
        </div>
        <button className="btn-ghost px-2 md:hidden" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label="Menu">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d={open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'} /></svg>
        </button>
      </div>
      {open && (
        <div className="border-t border-zinc-200 bg-white md:hidden">
          <div className="container-x flex flex-col gap-1 py-3">
            {nav.map(n => <NavLink key={n.to} to={n.to} end={n.end} className={linkCls}>{n.label}</NavLink>)}
            <div className="mt-2 flex gap-2 border-t border-zinc-100 pt-3">
              {user ? (
                <>
                  <Link to="/dashboard" className="btn-outline flex-1">Dashboard</Link>
                  <button className="btn-ghost flex-1" onClick={() => { logout(); navigate('/'); }}>Log out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-outline flex-1">Log in</Link>
                  <Link to="/register" className="btn-primary flex-1">Create account</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-24 bg-zinc-900 text-zinc-400">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">New cars from trusted brands, transparent pricing and doorstep delivery. Browse, compare and buy online in minutes.</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/cars" className="hover:text-white">All cars</Link></li>
            <li><Link to="/cars?category=Electric" className="hover:text-white">Electric</Link></li>
            <li><Link to="/cars?category=SUV" className="hover:text-white">SUVs</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Company</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-white">About us</Link></li>
            <li>Dhaka, Bangladesh</li>
            <li>hello@majesticmotors.test</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-800">
        <div className="container-x flex flex-wrap justify-between gap-2 py-5 text-xs">
          <span>© {new Date().getFullYear()} Majestic Motors. Demo project; payments are simulated.</span>
          <span>{IS_DEMO ? <>Live demo: your data is saved in this browser · <button className="underline underline-offset-2 hover:text-zinc-900" onClick={resetDemoData}>Reset demo data</button></> : 'Built with React, TypeScript, Express'}</span>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
