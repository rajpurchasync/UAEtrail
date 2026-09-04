import { Link } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { MobileMenuButton } from './MobileMenu';

/** Slim mobile top bar (logo + hamburger) for pages without banner chrome. */
export const MobileConsumerNavBar = () => (
  <div className="md:hidden sticky top-0 z-50 glass-header border-b border-gray-100/80">
    <div className="max-w-7xl mx-auto px-4 pt-safe-plus-2 pb-2 flex items-center justify-between gap-3">
      <Link to="/" className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center shrink-0">
          <Mountain className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-bold text-gray-900 tracking-tight truncate">UAE Trail</span>
      </Link>
      <MobileMenuButton />
    </div>
  </div>
);
