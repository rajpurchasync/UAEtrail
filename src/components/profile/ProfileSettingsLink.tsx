import { Link } from 'react-router-dom';
import { ChevronRight, Settings } from 'lucide-react';
import { GlassCard } from '../mobile/GlassCard';

/** Settings entry — account, password, languages, sign out live on stack route. */
export const ProfileSettingsLink = () => (
  <Link to="/profile/settings" className="block">
    <GlassCard padding className="glass-card-interactive !py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
          <Settings className="h-5 w-5 text-neutral-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-900">Account settings</p>
          <p className="text-xs text-neutral-500">Password, email, languages, sign out</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
      </div>
    </GlassCard>
  </Link>
);
