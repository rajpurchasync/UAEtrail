import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useExploreMapChrome } from '../../discovery/discoveryPortExploreMapChrome';
import { browseListEntityLinkState } from './browseListNavState';

type BrowseItemLinkProps = {
  to: string;
  className?: string;
  exploreItemId?: string | null;
  /** Card coordinate — explore pans here when the pin is outside the current map. */
  mapPoint?: { lat: number; lng: number } | null;
  children: ReactNode;
  /** Standalone list side map — hover sync without explore chrome. */
  onMapHover?: (exploreItemId: string | null) => void;
};

export const browseCardHoverPoint = (
  card: {
    mapLatitude?: number | null;
    mapLongitude?: number | null;
    kind?: string | null;
  }
): { lat: number; lng: number; activityType?: import('../../components/ui/mapPinTypes').MapPinKind } | null => {
  const lat = card.mapLatitude;
  const lng = card.mapLongitude;
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const kind = card.kind;
  const activityType =
    kind === 'rideshare' ||
    kind === 'hiking' ||
    kind === 'camping' ||
    kind === 'event' ||
    kind === 'shop' ||
    kind === 'agency' ||
    kind === 'destination'
      ? kind
      : undefined;
  return activityType ? { lat, lng, activityType } : { lat, lng };
};

const isDesktopHover = () =>
  typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

export const emitBrowseListMapHover = (
  chrome: ReturnType<typeof useExploreMapChrome>,
  onMapHover: ((exploreItemId: string | null) => void) | undefined,
  id: string | null,
  mapPoint: { lat: number; lng: number } | null
) => {
  /** Side-map column (standalone `/list`) — id only. */
  onMapHover?.(id);
  /** Explore map behind the desktop rail — needs coords to inject a missing pin. */
  if (!isDesktopHover()) return;
  chrome?.setListHoverExploreItemId(id, id ? mapPoint : null);
};

/** Entity navigation from browse layouts — return stack preserves list/explore URL. */
export const BrowseItemLink = ({
  to,
  className,
  exploreItemId,
  mapPoint = null,
  children,
  onMapHover,
}: BrowseItemLinkProps) => {
  const location = useLocation();
  const chrome = useExploreMapChrome();
  const returnTo = `${location.pathname}${location.search}`;

  const emitHover = (id: string | null) => {
    emitBrowseListMapHover(chrome, onMapHover, id, mapPoint);
  };

  return (
    <Link
      to={to}
      state={browseListEntityLinkState(returnTo)}
      className={className}
      onMouseEnter={() => {
        if (!exploreItemId) return;
        emitHover(exploreItemId);
      }}
      onMouseLeave={() => {
        if (!exploreItemId) return;
        emitHover(null);
      }}
    >
      {children}
    </Link>
  );
};
