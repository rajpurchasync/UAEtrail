import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  Flag,
  Globe2,
  Landmark,
  MapPinned,
  Mountain,
  Store,
  Tent,
} from 'lucide-react';
import type { GeoKind } from '@uaetrail/shared-types';
import { EnvironmentImage } from '../components/ui/EnvironmentImage';

const GEO_KIND_ICON: Record<GeoKind, LucideIcon> = {
  country: Globe2,
  state: Landmark,
  area: MapPinned,
  venue: Flag,
};

export const placeTypeIcon = (activityType?: string): LucideIcon => {
  const kind = activityType?.toLowerCase() ?? '';
  if (kind === 'hiking') return Mountain;
  if (kind === 'camping') return Tent;
  if (kind === 'event' || kind === 'community_activity') return CalendarDays;
  if (kind === 'shop') return Store;
  return MapPinned;
};

export const placeTypeLabel = (activityType?: string): string => {
  const kind = activityType?.toLowerCase() ?? '';
  if (kind === 'hiking') return 'Trail';
  if (kind === 'camping') return 'Camp';
  if (kind === 'event' || kind === 'community_activity') return 'Venue';
  if (kind === 'shop') return 'Shop';
  return 'Place';
};

const MarkFrame = ({ children }: { children: ReactNode }) => (
  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 text-emerald-800 md:h-8 md:w-8 dark:bg-emerald-950 dark:text-emerald-100">
    {children}
  </span>
);

export const GeoKindMark = ({ kind }: { kind: GeoKind }) => {
  const Icon = GEO_KIND_ICON[kind] ?? MapPinned;
  return (
    <MarkFrame>
      <Icon className="h-5 w-5" aria-hidden strokeWidth={2} />
    </MarkFrame>
  );
};

export const GeoPhotoMark = ({
  src,
  FallbackIcon,
}: {
  src?: string | null;
  FallbackIcon: LucideIcon;
}) => {
  const url = src?.trim();
  if (url) {
    return (
      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        <EnvironmentImage src={url} alt="" catalogThumb className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <MarkFrame>
      <FallbackIcon className="h-5 w-5" aria-hidden strokeWidth={2} />
    </MarkFrame>
  );
};
