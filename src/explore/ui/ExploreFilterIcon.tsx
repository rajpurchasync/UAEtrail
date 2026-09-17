import {
  CalendarDays,
  Car,
  Mountain,
  ShoppingBag,
  Tent,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityListFilterKey, MapFilterKey, VenueListFilterKey } from '../../utils/exploreRouting';

type ExploreFilterKey = MapFilterKey | ActivityListFilterKey | VenueListFilterKey | 'others' | 'shops';

const FILTER_ICONS: Partial<Record<ExploreFilterKey, LucideIcon>> = {
  hiking: Mountain,
  camping: Tent,
  event: CalendarDays,
  others: CalendarDays,
  shop: ShoppingBag,
  shops: ShoppingBag,
  carpool: Car,
};

interface ExploreFilterIconProps {
  filter: ExploreFilterKey;
  className?: string;
}

/** Lucide icon for explore map/list filter pills — replaces emoji chips on mobile. */
export const ExploreFilterIcon = ({ filter, className = 'h-4 w-4 shrink-0' }: ExploreFilterIconProps) => {
  if (filter === 'all') return null;
  const Icon = FILTER_ICONS[filter];
  if (!Icon) return null;
  return <Icon className={className} strokeWidth={2.25} aria-hidden />;
};
