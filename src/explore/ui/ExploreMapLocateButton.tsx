import { LocateFixed } from 'lucide-react';
import {
  EXPLORE_MAP_OVERLAY_ICON,
  EXPLORE_MAP_OVERLAY_ICON_BTN,
  EXPLORE_MAP_OVERLAY_ICON_STROKE,
} from '../../config/exploreTheme';
import { UiTooltip } from '../../components/ui/UiTooltip';

type ExploreMapLocateButtonProps = {
  onLocate: () => void;
  locating?: boolean;
  className?: string;
};

/** Pan the explore map to the member's current device location. */
export const ExploreMapLocateButton = ({
  onLocate,
  locating = false,
  className = '',
}: ExploreMapLocateButtonProps) => {
  const label = locating ? 'Locating you on the map' : 'Locate me on the map';
  return (
  <UiTooltip label={label}>
  <button
    type="button"
    onClick={onLocate}
    disabled={locating}
    className={`${EXPLORE_MAP_OVERLAY_ICON_BTN} ${className}`}
    aria-label={label}
  >
    <LocateFixed
      className={`${EXPLORE_MAP_OVERLAY_ICON} ${locating ? 'animate-pulse' : ''}`}
      strokeWidth={EXPLORE_MAP_OVERLAY_ICON_STROKE}
      aria-hidden
    />
  </button>
  </UiTooltip>
  );
};
