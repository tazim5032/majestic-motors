import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="container-x py-14">
      <div className="max-w-3xl">
        <p className="eyebrow">About us</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Buying a car should feel simple.</h1>
        <p className="mt-6 text-lg leading-relaxed text-zinc-600">
          Majestic Motors is an online car shop that makes buying a new car as clear as buying anything else online:
          honest prices, real-time stock, a secure checkout and an order you can follow all the way to your door.
        </p>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {[
          ['Our mission', 'Remove the guesswork from car buying with transparent information and a fast, fair process.'],
          ['What we sell', 'New sedans, SUVs, trucks, hatchbacks, sports cars, EVs and luxury models from leading brands.'],
          ['How we deliver', 'Every paid order is prepared, shipped and delivered with status updates in your dashboard.'],
        ].map(([t, d]) => (
          <div key={t} className="card p-7">
            <h2 className="text-lg font-semibold">{t}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">{d}</p>
          </div>
        ))}
      </div>
      <div className="card mt-6 p-7">
        <h2 className="text-lg font-semibold">About this project</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          A portfolio rebuild of Majestic Motors by Mohammad Fakhrul Islam: React, TypeScript, Tailwind CSS and an Express + TypeScript API
          with JWT authentication, role-based dashboards and a simulated SurjoPay payment flow. Payments are not real.
        </p>
        <Link to="/cars" className="btn-primary mt-5">Browse inventory</Link>
      </div>
    </div>
  );
}
