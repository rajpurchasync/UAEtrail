import { lazy, Suspense, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { getMapBounds } from '../../config/regions';
import { MAP_CONFIG, getExploreMapTiles, readExploreMapStyle } from '../../config/platform';
import { expandMapPins, layoutColocatedMapPins } from '../../explore/ui/exploreMapPinModel';
import { ExploreMapLoadingSkeleton } from '../../explore/ui/ExploreMapLoadingSkeleton';
import type { MapRecenterTarget } from '../../lib/mapRecenter';
import { UiTooltip } from '../../components/ui/UiTooltip';

const PlacesMap = lazy(() =>
  import('../../components/ui/PlacesMap').then((module) => ({ default: module.PlacesMap }))
);

type Props = {
  items: ExploreMapItemDTO[];
  loading: boolean;
  highlightedExploreItemId: string | null;
  selectedExploreItemId: string | null;
  onSelectItem: (item: ExploreMapItemDTO) => void;
  onClose?: () => void;
  layoutRevision?: boolean;
  className?: string;
};

/** Standalone `/list` — filtered pins on the right; hover/select emphasis matches explore. */
export const ListDiscoveryMapColumn = ({
  items,
  loading,
  highlightedExploreItemId,
  selectedExploreItemId,
  onSelectItem,
  onClose,
  layoutRevision,
  className = '',
}: Props) => {
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
          zoom: 14,
          nonce: Date.now(),
        });
      }
    }
  };

  return (
    <div
      className={`relative hidden min-h-0 min-w-0 flex-1 self-stretch border-l border-neutral-200 bg-[#2a3441] md:flex md:min-w-[min(36vw,420px)] md:max-w-[min(42vw,480px)] md:flex-none ${className}`}
      aria-label="Browse map"
    >
      {onClose ? (
        <UiTooltip label="Close map">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-[1000] inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-neutral-900/75 text-white shadow-lg backdrop-blur-sm hover:bg-neutral-900/90"
            aria-label="Close map"
          >
            <X className="h-4 w-4 stroke-[2.5]" aria-hidden />
          </button>
        </UiTooltip>
      ) : null}
      {loading && mapPins.length === 0 ? <ExploreMapLoadingSkeleton /> : null}
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
          layoutRevision={layoutRevision}
          flyToHighlightedPin
          className="h-full w-full min-h-[240px]"
        />
      </Suspense>
    </div>
  );
};
