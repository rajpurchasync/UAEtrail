import { Minus, Plus } from 'lucide-react';
import {
  EXPLORE_MAP_FROST_TRAY,
  EXPLORE_MAP_OVERLAY_ICON,
  EXPLORE_MAP_OVERLAY_ICON_BTN,
  EXPLORE_MAP_OVERLAY_ICON_STROKE,
} from '../../config/exploreTheme';
import { UiTooltip } from '../../components/ui/UiTooltip';
import { ExploreMapLocateButton } from './ExploreMapLocateButton';
import { ExploreMapStyleToggle } from './ExploreMapStyleToggle';
import type { ExploreMapStyle } from '../../config/platform';

type ExploreMapControlToolbarProps = {
  showZoom?: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onLocate: () => void;
  locating?: boolean;
  mapStyle: ExploreMapStyle;
  onToggleMapStyle: () => void;
};

/** Vertical map chrome — zoom, locate, and basemap, one frosted tray. */
export const ExploreMapControlToolbar = ({
  showZoom = false,
  onZoomIn,
  onZoomOut,
  onLocate,
  locating = false,
  mapStyle,
  onToggleMapStyle,
}: ExploreMapControlToolbarProps) => (
  <div
    className={`pointer-events-auto flex flex-col items-center gap-0.5 ${EXPLORE_MAP_FROST_TRAY}`}
    role="toolbar"
    aria-label="Map controls"
  >
    {showZoom ? (
      <>
        <UiTooltip label="Zoom in">
          <button
            type="button"
            onClick={onZoomIn}
            className={EXPLORE_MAP_OVERLAY_ICON_BTN}
            aria-label="Zoom in"
          >
            <Plus className={EXPLORE_MAP_OVERLAY_ICON} strokeWidth={EXPLORE_MAP_OVERLAY_ICON_STROKE} aria-hidden />
          </button>
        </UiTooltip>
        <UiTooltip label="Zoom out">
          <button
            type="button"
            onClick={onZoomOut}
            className={EXPLORE_MAP_OVERLAY_ICON_BTN}
            aria-label="Zoom out"
          >
            <Minus className={EXPLORE_MAP_OVERLAY_ICON} strokeWidth={EXPLORE_MAP_OVERLAY_ICON_STROKE} aria-hidden />
          </button>
        </UiTooltip>
      </>
    ) : null}
    <ExploreMapLocateButton onLocate={onLocate} locating={locating} />
    <ExploreMapStyleToggle style={mapStyle} onToggle={onToggleMapStyle} />
  </div>
);
