import { lazy, Suspense, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AreaCenter, AreaBoundsRing } from '@uaetrail/shared-types';
import { placeDetailPath } from '@uaetrail/shared-types';
import type { LocationDTO } from '@uaetrail/shared-types';
import type { MapBounds, PlaceMapPin } from '../ui/placesMapTypes';
import { explorePath } from '../../explore/routing';
import { placeDetailRouteKindForRow } from './destinationHubPlaceGroups';

const LazyPlacesMap = lazy(() =>
  import('../ui/PlacesMap').then((module) => ({ default: module.PlacesMap }))
);

type DestinationHubMapStripProps = {
  destinationSlug: string;
  areaName: string;
  center: AreaCenter;
  boundsRing: AreaBoundsRing;
  places: LocationDTO[];
};

const boundsFromRing = (ring: AreaBoundsRing): MapBounds => {
  if (ring.length === 0) {
    return { west: 54, south: 22, east: 56, north: 26 };
  }
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const p of ring) {
    west = Math.min(west, p.longitude);
    south = Math.min(south, p.latitude);
    east = Math.max(east, p.longitude);
    north = Math.max(north, p.latitude);
  }
  return { west, south, east, north };
};

const placeToPin = (place: LocationDTO): PlaceMapPin | null => {
  if (place.latitude == null || place.longitude == null) return null;
  const routeKind = placeDetailRouteKindForRow(place);
  return {
    id: `venue:${place.id}`,
    name: place.name,
    latitude: place.latitude,
    longitude: place.longitude,
    activityType: place.activityType === 'shop' ? 'shop' : routeKind,
    path: placeDetailPath(routeKind, place.id),
    source: 'place',
  };
};

/** Compact map preview — tap opens explore filtered to this area. */
export const DestinationHubMapStrip = ({
  destinationSlug,
  areaName,
  center,
  boundsRing,
  places,
}: DestinationHubMapStripProps) => {
  const navigate = useNavigate();
  const exploreInArea = explorePath({ area: destinationSlug });
  const fallbackBounds = useMemo(() => boundsFromRing(boundsRing), [boundsRing]);

  const pins = useMemo(() => {
    const rows: PlaceMapPin[] = [];
    for (const place of places) {
      const pin = placeToPin(place);
      if (pin) rows.push(pin);
    }
    return rows;
  }, [places]);

  return (
    <section className="relative mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <Suspense
        fallback={
          <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-500">
            Loading map…
          </div>
        }
      >
        <LazyPlacesMap
          pins={pins}
          bounds={fallbackBounds}
          minHeight={200}
          allowEmpty
          showLegend={false}
          exploreMode
          exploreMapCenter={{ lat: center.latitude, lng: center.longitude }}
          className="rounded-2xl"
          onPinClick={(pin) => {
            navigate(pin.path);
          }}
        />
      </Suspense>
      <Link
        to={exploreInArea}
        className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-slate-900/70 to-transparent px-4 py-3 text-sm font-semibold text-white"
      >
        Open map in {areaName}
      </Link>
    </section>
  );
};
