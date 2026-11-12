import { MapPin } from 'lucide-react';
import {
  COMPOSE_MAP_EDIT_LABEL,
  COMPOSE_MAP_OPEN_LABEL,
  COMPOSE_MAP_TAP_HINT,
} from '../../createFlowCopy';

export const formatComposeMapCoord = (
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  placed: boolean
): string => {
  if (placed && latitude != null && longitude != null) {
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
  return COMPOSE_MAP_TAP_HINT;
};

type Accent = 'emerald' | 'sky';

type ComposeMapEntryRowProps = {
  title: string;
  subtitle: string;
  placed: boolean;
  onOpen: () => void;
  accent?: Accent;
};

const accentClass: Record<Accent, { icon: string; action: string }> = {
  emerald: { icon: 'text-emerald-500', action: 'text-emerald-600' },
  sky: { icon: 'text-sky-500', action: 'text-sky-600' },
};

/** Shared “tap to choose on map” control — FAB, participant intent, Pro application. */
export const ComposeMapEntryRow = ({
  title,
  subtitle,
  placed,
  onOpen,
  accent = 'emerald',
}: ComposeMapEntryRowProps) => {
  const tone = accentClass[accent];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 bg-white px-4 py-4 text-left hover:border-emerald-300"
    >
      <span className="flex min-w-0 items-center gap-2 text-neutral-800">
        <MapPin className={`h-5 w-5 shrink-0 ${tone.icon}`} />
        <span className="min-w-0">
          <span className="block text-sm font-bold">{title}</span>
          <span className="block truncate text-xs text-neutral-500">{subtitle}</span>
        </span>
      </span>
      <span className={`shrink-0 text-xs font-semibold ${tone.action}`}>
        {placed ? COMPOSE_MAP_EDIT_LABEL : COMPOSE_MAP_OPEN_LABEL}
      </span>
    </button>
  );
};
