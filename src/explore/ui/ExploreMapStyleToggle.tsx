import { Map, Satellite } from 'lucide-react';
import {
  EXPLORE_MAP_OVERLAY_ICON,
  EXPLORE_MAP_OVERLAY_ICON_BTN,
  EXPLORE_MAP_OVERLAY_ICON_STROKE,
} from '../../config/exploreTheme';
import { UiTooltip } from '../../components/ui/UiTooltip';
import type { ExploreMapStyle } from '../../config/platform';
interface ExploreMapStyleToggleProps {
  style: ExploreMapStyle;
  onToggle: () => void;
  className?: string;
}

/** Switch explore base layer between satellite imagery and street map. */
export const ExploreMapStyleToggle = ({ style, onToggle, className = '' }: ExploreMapStyleToggleProps) => {
  const nextLabel = style === 'satellite' ? 'Map' : 'Satellite';
  const Icon = style === 'satellite' ? Map : Satellite;

  const label = `Switch to ${nextLabel.toLowerCase()} view`;
  return (
    <UiTooltip label={label}>
    <button
      type="button"
      onClick={onToggle}
      className={`${EXPLORE_MAP_OVERLAY_ICON_BTN} ${className}`}
      aria-label={label}
    >
      <Icon className={EXPLORE_MAP_OVERLAY_ICON} strokeWidth={EXPLORE_MAP_OVERLAY_ICON_STROKE} aria-hidden />
    </button>
    </UiTooltip>
  );
};
