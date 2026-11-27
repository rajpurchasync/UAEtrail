import type { Map as LeafletMap } from 'leaflet';
import type { PlaceKind, RetiredSeekingActivityModeWire } from '@uaetrail/shared-types';
import type { MapPinKind, MapPinSource } from './mapPinTypes';

export interface PlaceMapPin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  activityType: MapPinKind;
  path: string;
  hostAvatar?: string | null;
  source?: MapPinSource;
  activityMode?: 'hosted' | RetiredSeekingActivityModeWire;
  exploreItemId?: string;
  rideshareEndpoint?: 'from' | 'to';
  stackExploreItemIds?: string[];
  stackCount?: number;
  colocatedEntries?: ColocatedMapPinEntry[];
  placeKind?: PlaceKind;
  /** ISO date (YYYY-MM-DD) for hosted / seeking outing pins — map hover tooltip. */
  scheduleDate?: string | null;
  /** Upcoming hosted outings at this catalog place (venue pins). */
  hostedTripCount?: number;
  /** Spot / venue name for trip pin captions (≤2 words on map). */
  venueName?: string | null;
  /** @deprecated Prefer `venueName` for trip captions. */
  placeHub?: string | null;
  /** Catalog place cover for geography map circles. */
  pinCoverImage?: string | null;
}

export interface ColocatedMapPinEntry {
  activityType: MapPinKind;
  source?: MapPinSource;
  activityMode?: 'hosted' | RetiredSeekingActivityModeWire;
  exploreItemId: string;
  stackExploreItemIds?: string[];
  stackCount?: number;
}

export interface MapBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export type { MapPinKind, MapPinSource };

import type { ExploreMapStyle } from '../../config/platform';
import type { MapRecenterTarget } from '../../lib/mapRecenter';

export interface PlacesMapProps {
  pins: PlaceMapPin[];
  bounds: MapBounds;
  className?: string;
  minHeight?: number;
  fill?: boolean;
  allowEmpty?: boolean;
  selectedPinId?: string;
  selectedExploreItemId?: string;
  /** List hover preview — same pin emphasis as selection, without fly-to. */
  highlightedExploreItemId?: string;
  /** List card coordinate when that pin is outside the loaded map window. */
  highlightFocus?: { lat: number; lng: number } | null;
  onPinClick?: (pin: PlaceMapPin) => void;
  showLegend?: boolean;
  tileUrl?: string;
  labelTileUrl?: string | null;
  recenterTo?: MapRecenterTarget | null;
  exploreMode?: boolean;
  /** Overrides explore default center — device fix or regional UAE framing. */
  exploreMapCenter?: { lat: number; lng: number } | null;
  onZoomChange?: (zoom: number) => void;
  /** Debounced viewport bounds (explore map bbox fetch). */
  onVisibleBoundsChange?: (bounds: MapBounds) => void;
  tileAttribution?: string;
  minZoom?: number;
  onMapReady?: (map: LeafletMap | null) => void;
  /** Bumps Leaflet invalidateSize when mobile list sheet / layout chrome changes. */
  layoutRevision?: number | string | boolean;
  /** List / guest side map — pan at session zoom; no zoom bumps. */
  flyToHighlightedPin?: boolean;
  /** Map-container pixels of the selected pin — peek bubble origin. */
  onSelectedPinScreenPoint?: (point: { x: number; y: number } | null) => void;
  /** Shown after Locate me / allow location — blue dot at device coordinates. */
  deviceLocation?: { lat: number; lng: number } | null;
  /** When set, clicking the map canvas (not a pin) dismisses the open peek. */
  onDismissMapPeek?: () => void;
  exploreMapStyle?: ExploreMapStyle;
};
