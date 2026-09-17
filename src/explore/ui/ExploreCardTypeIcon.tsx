import {
  Building2,
  CalendarDays,
  Car,
  MapPin,
  Mountain,
  ShoppingBag,
  Tent,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import type { ExploreCardKind, ExploreCardSource, ExploreCardTone } from '../exploreCardModel';
import { exploreCardToneClass } from '../exploreCardModel';

const CARD_ICONS: Record<ExploreCardTone, LucideIcon> = {
  hiking: Mountain,
  camping: Tent,
  event: CalendarDays,
  shop: ShoppingBag,
  agency: Building2,
  carpool: Car,
};

interface ExploreCardTypeIconProps {
  tone: ExploreCardTone;
  source?: ExploreCardSource;
  kind?: ExploreCardKind;
  size?: 'sm' | 'md' | 'overlay';
  className?: string;
}

const sizeClasses = {
  sm: 'h-11 w-11',
  md: 'h-12 w-12',
  overlay: 'h-6 w-6',
} as const;

const iconSizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  overlay: 'h-3.5 w-3.5',
} as const;

/** Colored circular badge with Lucide icon — replaces emoji type badges in browse lists. */
export const ExploreCardTypeIcon = ({
  tone,
  source,
  kind,
  size = 'md',
  className = '',
}: ExploreCardTypeIconProps) => {
  const Icon =
    source === 'demand'
      ? UserRound
      : source === 'venue' && kind === 'hiking'
        ? Mountain
        : CARD_ICONS[tone] ?? MapPin;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${sizeClasses[size]} ${exploreCardToneClass[tone]} ${className}`}
      aria-hidden
    >
      <Icon className={iconSizeClasses[size]} strokeWidth={2.25} />
    </span>
  );
};
