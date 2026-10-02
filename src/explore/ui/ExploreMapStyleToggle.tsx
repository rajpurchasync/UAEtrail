import { Map, Satellite } from 'lucide-react';
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

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`pointer-events-auto inline-flex shrink-0 items-center justify-center text-white drop-shadow-[0_1px_4px_rgba(0,0,0,.75)] transition active:scale-95 ${className}`}
      aria-label={`Switch to ${nextLabel.toLowerCase()} view`}
      title={`Switch to ${nextLabel.toLowerCase()} view`}
    >
      <Icon className="h-6 w-6 shrink-0" strokeWidth={2.25} aria-hidden />
    </button>
  );
};
