import { lazy, Suspense, useMemo, useState } from 'react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { getMapBounds } from '../../config/regions';
import { MAP_CONFIG, getExploreMapTiles, readExploreMapStyle } from '../../config/platform';
import { useExploreMap } from '../../hooks/useExploreMap';
import { expandMapPins, layoutColocatedMapPins } from '../../explore/ui/exploreMapPinModel';
import { ExploreMapLoadingSkeleton } from '../../explore/ui/ExploreMapLoadingSkeleton';
import type { MapRecenterTarget } from '../../lib/mapRecenter';

const PlacesMap = lazy(() =>
  import('../ui/PlacesMap').then((module) => ({ default: module.PlacesMap }))
);

type Props = {
  highlightedExploreItemId: string | null;
  selectedExploreItemId: string | null;
  onSelectItem: (item: ExploreMapItemDTO) => void;
  className?: string;
};

/** Guest preview catalog — compact map column with hover/selection emphasis on pins. */
export const GuestPreviewMapColumn = ({
  highlightedExploreItemId,
  selectedExploreItemId,
  onSelectItem,
  className = '',
}: Props) => {
  const { data: items = [], isLoading } = useExploreMap();
  const [recenterTo, setRecenterTo] = useState<MapRecenterTarget | null>(null);
  const exploreMapTiles = getExploreMapTiles(readExploreMapStyle());

  const mapPins = useMemo(
    () => layoutColocatedMapPins(expandMapPins(items)),
    [items]
  );

  const handlePinClick = (pin: { exploreItemId?: string; id: string }) => {
    const id = pin.exploreItemId ?? pin.id;
    const item = items.find((entry) => entry.id === id);
    if (item) {
      onSelectItem(item);
      if (item.latitude != null && item.longitude != null) {
        setRecenterTo({
          lat: item.latitude,
          lng: item.longitude,
          zoom: 12,
          nonce: Date.now(),
        });
      }
    }
  };

  return (
    <div
      className={`relative min-h-0 min-w-0 flex-1 self-stretch border-l border-neutral-200 bg-[#2a3441] md:min-w-[min(36vw,420px)] md:max-w-[min(42vw,480px)] md:flex-none ${className}`}
      aria-label="Preview map"
    >
      {isLoading && mapPins.length === 0 ? <ExploreMapLoadingSkeleton /> : null}
      <Suspense fallback={<div className="h-full min-h-[200px] w-full bg-[#2a3441]" aria-hidden />}>
        <PlacesMap
          pins={mapPins}
          bounds={getMapBounds()}
          fill
          allowEmpty
          exploreMode
          showLegend={false}
          selectedExploreItemId={selectedExploreItemId ?? undefined}
          highlightedExploreItemId={highlightedExploreItemId ?? undefined}
          tileUrl={exploreMapTiles.tileUrl}
          tileAttribution={MAP_CONFIG.exploreTileAttribution}
          labelTileUrl={exploreMapTiles.labelTileUrl}
          onPinClick={handlePinClick}
          recenterTo={recenterTo}
          className="h-full w-full min-h-[240px]"
        />
      </Suspense>
    </div>
  );
};
