import { CalendarDays } from 'lucide-react';
import { BrowseItemLink } from '../discoverySessionListBrowseLink';

type DiscoveryBrowseCardScheduleRowProps = {
  hint: string;
  path: string | null;
  exploreItemId: string | null;
  onMapHover?: (exploreItemId: string | null) => void;
};

/** Venue card — linked outings hint in body (not on hero). */
export const DiscoveryBrowseCardScheduleRow = ({
  hint,
  path,
  exploreItemId,
  onMapHover,
}: DiscoveryBrowseCardScheduleRowProps) => {
  const className =
    'inline-flex max-w-full items-center gap-1 text-[12px] font-semibold text-emerald-800';

  if (path) {
    return (
      <BrowseItemLink
        to={path}
        exploreItemId={exploreItemId}
        onMapHover={onMapHover}
        className={`${className} rounded-lg bg-emerald-50 px-2 py-1 ring-1 ring-emerald-100/80 hover:bg-emerald-100/90`}
      >
        <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="min-w-0 truncate">{hint}</span>
      </BrowseItemLink>
    );
  }

  return (
    <p className={className}>
      <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="min-w-0 truncate">{hint}</span>
    </p>
  );
};