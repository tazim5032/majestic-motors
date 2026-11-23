import { Link } from 'react-router-dom';
import { CarIllustration } from '../components/CarArt';

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-20 text-center">
      <CarIllustration category="Hatchback" color="#d4d4d8" className="w-72" />
      <p className="eyebrow mt-6">Error 404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Wrong turn</h1>
      <p className="mt-2 text-zinc-500">We couldn't find that page.</p>
      <Link to="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}
