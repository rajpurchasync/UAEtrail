import { Map, Satellite } from 'lucide-react';
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
      className={`pointer-events-auto inline-flex shrink-0 items-center justify-center text-white drop-shadow-[0_1px_4px_rgba(0,0,0,.75)] transition active:scale-95 ${className}`}
      aria-label={label}
    >
      <Icon className="h-6 w-6 shrink-0" strokeWidth={2.25} aria-hidden />
    </button>
    </UiTooltip>
  );
};
