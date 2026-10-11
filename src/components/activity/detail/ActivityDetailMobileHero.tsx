import type { ReactNode } from 'react';
import { formatActivityDetailHeroDate } from '../../../activity/formatActivityDetailHeroDate';
import { ActivityDetailHeroStatusStrip } from './ActivityDetailHeroStatusStrip';
import type { ActivityDetailHeroStatusChip } from '../../../activity/activityDetailHeroStatus';

type ActivityDetailMobileHeroProps = {
  venueLine?: ReactNode;
  date: string;
  title: string;
  trailing?: ReactNode;
  statusChips?: ActivityDetailHeroStatusChip[];
};

/** Title + when block below mobile tabs (banner stays kind-only). */
export const ActivityDetailMobileHero = ({
  venueLine,
  date,
  title,
  trailing,
  statusChips = [],
}: ActivityDetailMobileHeroProps) => (
  <header className="md:hidden px-4 pt-3 pb-2">
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1 space-y-1">
        {venueLine ? <div className="text-sm text-neutral-600 truncate">{venueLine}</div> : null}
        <p className="text-xs font-semibold text-neutral-500">{formatActivityDetailHeroDate(date)}</p>
        <h1 className="text-2xl font-bold text-neutral-900 leading-tight">{title}</h1>
        <ActivityDetailHeroStatusStrip chips={statusChips} />
      </div>
      {trailing ? <div className="shrink-0 pt-1">{trailing}</div> : null}
    </div>
  </header>
);
