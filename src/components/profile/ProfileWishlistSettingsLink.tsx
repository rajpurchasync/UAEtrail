import { Link } from 'react-router-dom';
import { ChevronRight, MapPin } from 'lucide-react';
import { GlassCard } from '../mobile/GlassCard';
import { tripsPath } from '../../config/routingCatalog';

/** Settings stack entry — wishlist is managed on Profile, not explore chrome. */
export const ProfileWishlistSettingsLink = () => (
  <GlassCard padding className="!p-0 overflow-hidden animate-fade-up">
    <Link
      to={tripsPath({ layer: 'places' })}
      className="flex items-center gap-3 px-4 py-3.5 text-left active:bg-neutral-50"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"
        aria-hidden
      >
        <MapPin className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-900">Saved map &amp; alerts</p>
        <p className="text-xs text-neutral-500">Starred places and plans from explore</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
    </Link>
  </GlassCard>
);
