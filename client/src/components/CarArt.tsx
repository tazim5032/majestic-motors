import { useState } from 'react';
import type { Category } from '../lib/types';

// Side-profile silhouettes (front faces right) drawn in a 400x160 box.
const SHAPES: Record<'sedan' | 'suv' | 'truck' | 'hatch' | 'sports' | 'luxury', { body: string; glass: string[]; wheels: [number, number]; r: number }> = {
  sedan: {
    body: 'M24 112 L28 92 Q34 80 64 77 L120 72 L152 50 Q162 44 178 44 L250 44 Q266 44 280 53 L312 73 L352 78 Q376 82 380 96 L382 112 Z',
    glass: ['M160 54 L180 50 L212 50 L212 71 L136 71 Z', 'M219 50 L250 50 Q262 50 273 58 L292 71 L219 71 Z'],
    wheels: [98, 310], r: 22,
  },
  luxury: {
    body: 'M18 112 L22 92 Q28 80 60 77 L118 72 L154 47 Q164 41 182 41 L262 41 Q280 41 294 51 L324 72 L360 77 Q382 82 386 96 L388 112 Z',
    glass: ['M162 52 L184 47 L222 47 L222 70 L138 70 Z', 'M229 47 L262 47 Q275 47 287 56 L305 70 L229 70 Z'],
    wheels: [96, 318], r: 23,
  },
  suv: {
    body: 'M22 114 L22 82 Q24 68 48 66 L108 64 L138 36 Q146 30 160 30 L298 30 Q314 30 324 40 L350 64 L368 68 Q384 72 384 90 L384 114 Z',
    glass: ['M148 40 L214 40 L214 63 L122 63 Z', 'M221 40 L298 40 Q310 40 318 48 L336 63 L221 63 Z'],
    wheels: [98, 312], r: 25,
  },
  truck: {
    body: 'M18 114 L18 72 L186 72 L186 42 Q186 30 200 30 L280 30 Q296 30 306 44 L322 66 L366 72 Q386 76 386 94 L386 114 Z',
    glass: ['M200 38 L278 38 Q290 38 298 50 L308 65 L200 65 Z'],
    wheels: [86, 318], r: 25,
  },
  hatch: {
    body: 'M44 112 L44 86 Q46 72 62 64 L94 46 Q104 40 120 40 L230 40 Q250 40 264 52 L290 72 L336 78 Q362 82 366 96 L368 112 Z',
    glass: ['M76 68 L100 51 Q106 46 118 46 L162 46 L162 70 L76 70 Z', 'M169 46 L228 46 Q244 46 254 56 L270 70 L169 70 Z'],
    wheels: [104, 308], r: 22,
  },
  sports: {
    body: 'M20 108 L28 94 Q48 86 92 84 L150 64 Q172 54 204 54 L240 54 Q264 54 288 68 L322 82 L364 88 Q384 92 386 102 L386 108 Z',
    glass: ['M160 68 Q176 61 204 61 L228 61 L228 81 L140 81 Z', 'M234 61 Q258 61 276 71 L292 81 L234 81 Z'],
    wheels: [102, 318], r: 20,
  },
};

const shapeFor = (c: Category) =>
  c === 'SUV' ? SHAPES.suv : c === 'Truck' ? SHAPES.truck : c === 'Hatchback' ? SHAPES.hatch
  : c === 'Sports' ? SHAPES.sports : c === 'Luxury' ? SHAPES.luxury : SHAPES.sedan;

export function CarIllustration({ category, color, className = '' }: { category: Category; color: string; className?: string }) {
  const s = shapeFor(category);
  return (
    <svg viewBox="0 0 400 150" className={className} role="img" aria-label={`${category} illustration`}>
      <ellipse cx="200" cy="138" rx="176" ry="7" fill="#18181b" opacity="0.10" />
      <path d={s.body} fill={color} stroke="#18181b" strokeOpacity="0.18" strokeWidth="1.5" />
      <path d={s.body} fill="url(#shine)" opacity="0.35" />
      {s.glass.map((g, i) => <path key={i} d={g} fill="#1f2937" opacity="0.82" />)}
      {category === 'Electric' && <path d="M346 84 l-8 12 h7 l-5 11 12 -15 h-7 l5 -8 z" fill="#ffffff" opacity="0.9" />}
      {s.wheels.map(x => (
        <g key={x}>
          <circle cx={x} cy={114} r={s.r} fill="#18181b" />
          <circle cx={x} cy={114} r={s.r * 0.55} fill="#a1a1aa" />
          <circle cx={x} cy={114} r={s.r * 0.18} fill="#3f3f46" />
        </g>
      ))}
      <defs>
        <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Shows the car's photo if it has one, otherwise a clean illustration. */
export function CarVisual({ car, className = '', size = 'md' }: {
  car: { image?: string; category: Category; color: string; brand: string; name: string };
  className?: string; size?: 'sm' | 'md' | 'lg';
}) {
  const [broken, setBroken] = useState(false);
  const pad = size === 'lg' ? 'p-10' : size === 'sm' ? 'p-2' : 'p-6';
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-zinc-100 to-zinc-200/70 ${className}`}>
      {car.image && !broken
        ? <img src={car.image} alt={`${car.brand} ${car.name}`} className="h-full w-full object-cover" onError={() => setBroken(true)} loading="lazy" />
        : <CarIllustration category={car.category} color={car.color} className={`h-full w-full ${pad}`} />}
    </div>
  );
}
