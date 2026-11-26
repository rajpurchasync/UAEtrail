import { Car, ChevronRight } from 'lucide-react';
import { BrowseItemLink } from '../discoveryPortListBrowseLink';

export type DiscoveryBrowseCardCarpoolRowProps = {
  label: string;
  path: string;
  exploreItemId: string | null;
  onMapHover?: (exploreItemId: string | null) => void;
};

/** S6 carpool affordance in the card body (not on the hero). */
export const DiscoveryBrowseCardCarpoolRow = ({
  label,
  path,
  exploreItemId,
  onMapHover,
}: DiscoveryBrowseCardCarpoolRowProps) => (
  <BrowseItemLink
    to={path}
    exploreItemId={exploreItemId}
    onMapHover={onMapHover}
    aria-label={
      label.includes('carpools')
        ? `${label} — view outing for rideshare links`
        : `${label} — open linked rideshare`
    }
    className="inline-flex max-w-full items-center gap-1 rounded-lg bg-sky-50 px-2 py-1.5 text-[12px] font-semibold text-sky-900 ring-1 ring-sky-100/80 transition hover:bg-sky-100/90"
  >
    <Car className="h-3.5 w-3.5 shrink-0" aria-hidden />
    <span className="min-w-0 truncate">{label}</span>
    <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
  </BrowseItemLink>
);