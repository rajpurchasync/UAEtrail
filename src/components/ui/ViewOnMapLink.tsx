import type { MouseEvent, PointerEvent, ReactNode } from 'react';
import { buildGoogleMapsSearchUrl } from '../../utils/mapLinks';

const stopEvent = (event: MouseEvent | PointerEvent) => {
  event.stopPropagation();
};

export interface ViewOnMapLinkProps {
  lat: number;
  lng: number;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  /** When true, stop propagation for map peek / list row parents. */
  isolateClick?: boolean;
}

/**
 * Read-only “view this pin” link — Google Maps search at lat/lng.
 * For turn-by-turn navigation use {@link DirectionsControl} (Google / Waze / Apple).
 */
export const ViewOnMapLink = ({
  lat,
  lng,
  children,
  className = '',
  ariaLabel,
  isolateClick = false,
}: ViewOnMapLinkProps) => (
  <a
    href={buildGoogleMapsSearchUrl(lat, lng)}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={ariaLabel}
    className={className}
    onClick={isolateClick ? stopEvent : undefined}
    onPointerDown={isolateClick ? stopEvent : undefined}
  >
    {children}
  </a>
);
