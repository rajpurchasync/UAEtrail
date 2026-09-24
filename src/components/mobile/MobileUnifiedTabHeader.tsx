import { Link } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { ReactNode } from 'react';
import { EXPLORE_MAP_PATH } from '../../config/platform';
import { MobileProfileHeaderLink } from './MobileProfileHeaderLink';

export type MobileUnifiedTabHeaderCenter =
  | { kind: 'brand' }
  | { kind: 'title'; text: string };

interface MobileUnifiedTabHeaderProps {
  center: MobileUnifiedTabHeaderCenter;
  trailing?: ReactNode;
  profileActive?: boolean;
}

/** Single mobile tab header — avatar · brand or title · action (explore, profile, activities, messages). */
export const MobileUnifiedTabHeader = ({
  center,
  trailing,
  profileActive = false,
}: MobileUnifiedTabHeaderProps) => (
  <header className="relative z-[1100] shrink-0 border-b border-neutral-200/80 bg-white pb-2 pt-[calc(var(--safe-top)+4px)] lg:hidden">
    <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2 px-3">
      <MobileProfileHeaderLink activeOnProfile={profileActive} />

      {center.kind === 'brand' ? (
        <Link
          to={EXPLORE_MAP_PATH}
          className="flex min-w-0 items-center justify-center gap-1.5 justify-self-center"
          aria-label="Explore map"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-700">
            <Mountain className="h-4 w-4 text-white" strokeWidth={2.25} />
          </div>
          <span className="truncate text-sm font-bold tracking-tight text-gray-900">UAE Trail</span>
        </Link>
      ) : (
        <h1 className="truncate text-center text-[17px] font-semibold text-neutral-900">{center.text}</h1>
      )}

      <div className="flex justify-end justify-self-end min-h-[2.5rem] min-w-[2.5rem] items-center">
        {trailing ?? <span className="w-10" aria-hidden />}
      </div>
    </div>
  </header>
);
