import { LIST_CHIP_SCROLL, listCategoryPillClass } from '../listChromeTheme';
import type { CrewsAvailableOpenLens } from './crewsOpenSegment';

const OPEN_LABELS: Record<CrewsAvailableOpenLens, string> = {
  all: 'All',
  looking: 'Looking for crew',
  marked: 'Marked available',
};

type CrewsAvailableSubChipsProps = {
  lens: CrewsAvailableOpenLens;
  onLensChange: (lens: CrewsAvailableOpenLens) => void;
};

const OPEN_ORDER: CrewsAvailableOpenLens[] = ['all', 'looking', 'marked'];

export const CrewsAvailableSubChips = ({ lens, onLensChange }: CrewsAvailableSubChipsProps) => (
  <div className={`${LIST_CHIP_SCROLL} mb-3 min-w-0 max-w-full snap-x px-0.5`} role="group" aria-label="Available filters">
    {OPEN_ORDER.map((key) => {
      const active = lens === key;
      return (
        <button
          key={key}
          type="button"
          className={listCategoryPillClass(active)}
          aria-pressed={active}
          onClick={(event) => {
            event.preventDefault();
            onLensChange(key);
          }}
        >
          {OPEN_LABELS[key]}
        </button>
      );
    })}
  </div>
);
