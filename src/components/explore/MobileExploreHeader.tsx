import { Link } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { MobileSessionHeaderActions } from '../layout/MobileSessionHeaderActions';

/** Explore map header — logo left, session actions (bell + profile) on the right. */
export const MobileExploreHeader = () => (
  <header className="relative z-[1100] shrink-0 border-b border-white/50 bg-white/95 pt-safe-plus-2 shadow-sm backdrop-blur-md lg:hidden">
    <div className="flex h-14 items-center justify-between gap-3 px-4">
      <Link to="/" className="flex min-w-0 items-center gap-2" aria-label="UAE Trail home">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-700">
          <Mountain className="h-4 w-4 text-white" />
        </div>
        <span className="truncate text-base font-bold tracking-tight text-gray-900">UAE Trail</span>
      </Link>
      <MobileSessionHeaderActions className="shrink-0" />
    </div>
  </header>
);
