import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router';

export const BackLink = () => (
  <Link
    to="/quotes"
    className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink"
  >
    <ChevronLeft aria-hidden className="size-4" />
    Presupuestos
  </Link>
);
