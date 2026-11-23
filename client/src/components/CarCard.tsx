import { Link } from 'react-router-dom';
import { money } from '../lib/api';
import type { Car } from '../lib/types';
import { CarVisual } from './CarArt';
import { StockBadge } from './ui';

export function CarCard({ car }: { car: Car }) {
  return (
    <Link to={`/cars/${car.id}`} className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-zinc-300">
      <CarVisual car={car} className="aspect-[16/10]" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{car.year} · {car.category}</span>
          <StockBadge quantity={car.quantity} />
        </div>
        <h3 className="mt-2 text-base font-semibold leading-snug">
          <span className="text-zinc-500">{car.brand}</span> {car.name}
        </h3>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-xs text-zinc-600">
          <div><dt className="sr-only">Fuel</dt><dd>{car.fuel}</dd></div>
          <div><dt className="sr-only">Power</dt><dd>{car.horsepower} hp</dd></div>
          <div><dt className="sr-only">Economy</dt><dd className="truncate">{car.mileage}</dd></div>
        </dl>
        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="text-lg font-semibold tabular-nums">{money(car.price)}</span>
          <span className="text-sm font-medium text-zinc-500 transition group-hover:text-zinc-900">View details →</span>
        </div>
      </div>
    </Link>
  );
}

export function CarCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[16/10] animate-pulse bg-zinc-100" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
        <div className="h-5 w-1/4 animate-pulse rounded bg-zinc-100" />
      </div>
    </div>
  );
}
