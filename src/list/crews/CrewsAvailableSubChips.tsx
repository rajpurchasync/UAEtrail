import { LIST_CHIP_SCROLL, listCategoryPillClass } from '../browse/listChromeTheme';
import type { CrewsAvailableOpenLens } from './crewsOpenSegment';
import { EXPLORE_CREWS_MAP_SIGNALS_TITLE } from '@/content/exploreCrewsCopy';

const OPEN_LABELS: Record<CrewsAvailableOpenLens, string> = {
  all: 'All',
  open: EXPLORE_CREWS_MAP_SIGNALS_TITLE,
  marked: 'Marked available',
};

type CrewsAvailableSubChipsProps = {
  lens: CrewsAvailableOpenLens;
  onLensChange: (lens: CrewsAvailableOpenLens) => void;
};

const OPEN_ORDER: CrewsAvailableOpenLens[] = ['all', 'open', 'marked'];

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