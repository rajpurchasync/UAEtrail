import { lazy, Suspense, useMemo } from 'react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { getMapBounds } from '../../config/regions';
import { getExploreMapTiles, readExploreMapStyle } from '../../config/platform';
import { useExploreMap } from '../../hooks/useExploreMap';
import { expandMapPins, layoutColocatedMapPins } from '../../explore/ui/exploreMapPinModel';
import { ExploreMapLoadingSkeleton } from '../../explore/ui/ExploreMapLoadingSkeleton';
import { LIST_SIDE_MAP_MIN_PX } from '../../discovery/discoverySessionListMapSplit';

const PlacesMap = lazy(() =>
  import('../ui/PlacesMap').then((module) => ({ default: module.PlacesMap }))
);

type Props = {
  highlightedExploreItemId: string | null;
  selectedExploreItemId: string | null;
  onSelectItem: (item: ExploreMapItemDTO) => void;
  className?: string;
  layoutRevision?: boolean | number | string;
};

/** Guest preview catalog — compact map column with hover/selection emphasis on pins. */
export const GuestPreviewMapColumn = ({
  highlightedExploreItemId,
  selectedExploreItemId,
  onSelectItem,
  className = '',
  layoutRevision,
}: Props) => {
  const { data: items = [], isLoading } = useExploreMap();
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
    }
  };

  return (
    <div
      className={`relative min-h-0 min-w-0 flex-1 self-stretch border-l border-neutral-200 bg-[#2a3441] md:flex ${className}`}
      style={{ flex: '1 1 0%', minWidth: LIST_SIDE_MAP_MIN_PX }}
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
          tileAttribution={exploreMapTiles.attribution}
          labelTileUrl={exploreMapTiles.labelTileUrl}
          onPinClick={handlePinClick}
          flyToHighlightedPin
          layoutRevision={layoutRevision}
          className="h-full w-full min-h-[240px]"
        />
      </Suspense>
    </div>
  );
};
