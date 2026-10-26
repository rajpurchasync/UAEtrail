import { LocateFixed } from 'lucide-react';

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
}: ExploreMapLocateButtonProps) => (
  <button
    type="button"
    onClick={onLocate}
    disabled={locating}
    className={`pointer-events-auto inline-flex shrink-0 items-center justify-center text-white drop-shadow-[0_1px_4px_rgba(0,0,0,.75)] transition active:scale-95 disabled:opacity-60 ${className}`}
    aria-label={locating ? 'Locating you on the map' : 'Locate me on the map'}
    title="Locate me"
  >
    <LocateFixed
      className={`h-6 w-6 shrink-0 ${locating ? 'animate-pulse' : ''}`}
      strokeWidth={2.25}
      aria-hidden
    />
  </button>
);
