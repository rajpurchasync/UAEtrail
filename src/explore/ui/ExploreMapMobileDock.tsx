import { List, Plus } from 'lucide-react';
import { UiTooltip } from '../../components/ui/UiTooltip';
import {
  EXPLORE_MAP_MOBILE_DOCK_ICON,
  EXPLORE_MAP_MOBILE_DOCK_PRIMARY,
  EXPLORE_MAP_MOBILE_DOCK_SECONDARY,
} from '../../config/exploreTheme';
import type { ExploreMapStyle } from '../../config/platform';
import { ExploreMapControlToolbar } from './ExploreMapControlToolbar';

type ExploreMapMobileDockProps = {
  onOpenBrowse: () => void;
  onPrimaryFab: () => void;
  primaryFabLabel: string;
  onLocateMe: () => void;
  locatingDevice: boolean;
  exploreMapStyle: ExploreMapStyle;
  onToggleMapStyle: () => void;
};

/**
 * One mobile map dock: List and Create Trip share a height; locate and basemap
 * stack on the same right edge above Create Trip.
 */
export const ExploreMapMobileDock = ({
  onOpenBrowse,
  onPrimaryFab,
  primaryFabLabel,
  onLocateMe,
  locatingDevice,
  exploreMapStyle,
  onToggleMapStyle,
}: ExploreMapMobileDockProps) => (
  <div
    className="pointer-events-none absolute inset-x-0 z-[1100] px-4 md:hidden"
    style={{ bottom: 'calc(var(--explore-float-base) + var(--explore-map-fab-inset))' }}
  >
    <div className="flex items-end justify-between gap-3">
      <UiTooltip label="Open list view">
        <button
          type="button"
          onClick={onOpenBrowse}
          className={`pointer-events-auto ${EXPLORE_MAP_MOBILE_DOCK_SECONDARY}`}
          aria-label="Open list view"
        >
          <List className={EXPLORE_MAP_MOBILE_DOCK_ICON} strokeWidth={2.25} aria-hidden />
          <span className="mobile-dock-pill__label">List</span>
        </button>
      </UiTooltip>
      <div
        className="flex flex-col items-end"
        style={{ gap: 'var(--explore-map-mobile-control-gap)' }}
      >
        <ExploreMapControlToolbar
          layout="standalone"
          onLocate={onLocateMe}
          locating={locatingDevice}
          mapStyle={exploreMapStyle}
          onToggleMapStyle={onToggleMapStyle}
        />
        <UiTooltip label={primaryFabLabel}>
          <button
            type="button"
            onClick={() => onPrimaryFab()}
            className={`pointer-events-auto ${EXPLORE_MAP_MOBILE_DOCK_PRIMARY}`}
            aria-label={primaryFabLabel}
          >
            <Plus className={EXPLORE_MAP_MOBILE_DOCK_ICON} strokeWidth={2.5} aria-hidden />
            <span className="mobile-dock-pill__label truncate">{primaryFabLabel}</span>
          </button>
        </UiTooltip>
      </div>
    </div>
  </div>
);
