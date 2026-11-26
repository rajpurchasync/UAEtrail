import { lazy, Suspense, useMemo } from 'react';
import { X } from 'lucide-react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { getMapBounds } from '../../config/regions';
import { getExploreMapTiles, readExploreMapStyle } from '../../config/platform';
import {
  expandMapPins,
  layoutColocatedMapPins,
  ExploreMapLoadingSkeleton,
} from '../../discovery/discoverySessionExploreMapColumn';
import { UiTooltip } from '../../components/ui/UiTooltip';
import { LIST_MAP_COLUMN_CLOSE } from '../browse/listChromeTheme';
import { LIST_SIDE_MAP_MIN_PX } from '../browse/listDiscoverySideMapSplit';

const PlacesMap = lazy(() =>
  import('../../components/ui/PlacesMap').then((module) => ({ default: module.PlacesMap }))
);

type ListDiscoveryMapPresentation = 'sideColumn' | 'primary';

type Props = {
  items: ExploreMapItemDTO[];
  loading: boolean;
  highlightedExploreItemId: string | null;
  selectedExploreItemId: string | null;
  onSelectItem: (item: ExploreMapItemDTO) => void;
  onClose?: () => void;
  layoutRevision?: boolean | number | string;
  className?: string;
  /** `sideColumn` = `/list` split pane (desktop). `primary` = full-stage map (search results view). */
  presentation?: ListDiscoveryMapPresentation;
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
  presentation = 'sideColumn',
}: Props) => {
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

  const surfaceClass =
    presentation === 'primary'
      ? 'relative flex min-h-0 min-w-0 flex-1 self-stretch bg-[#2a3441]'
      : `relative hidden min-h-0 min-w-0 flex-1 self-stretch border-l border-neutral-200 bg-[#2a3441] md:flex`;

  return (
    <div
      className={`${surfaceClass} ${className}`}
      style={presentation === 'sideColumn' ? { flex: '1 1 0%', minWidth: LIST_SIDE_MAP_MIN_PX } : undefined}
      aria-label="Browse map"
      data-list-discovery-map={presentation}
    >
      {onClose ? (
        <UiTooltip label="Close map">
          <button
            type="button"
            onClick={onClose}
            className={LIST_MAP_COLUMN_CLOSE}
            aria-label="Close map"
          >
            <X className="explore-float-glyph h-4 w-4 stroke-[2.5]" aria-hidden />
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
          tileAttribution={exploreMapTiles.attribution}
          labelTileUrl={exploreMapTiles.labelTileUrl}
          onPinClick={handlePinClick}
          layoutRevision={layoutRevision}
          flyToHighlightedPin
          className="h-full w-full min-h-[240px]"
        />
      </Suspense>
    </div>
  );
};
