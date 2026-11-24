import type { ExploreSearchScope } from './exploreSearchRouting';
import {
  EXPLORE_SEARCH_SECTION_CREW,
  EXPLORE_SEARCH_SECTION_GROUPS,
  EXPLORE_SEARCH_SECTION_SPOTS,
  EXPLORE_SEARCH_SECTION_TRIPS,
} from './exploreSearchHomeCopy';
import { listChipClass } from '../../list/browse/listChromeTheme';
import { FEATURE_FLAGS } from '../../config/platform';

const RECOMMENDED_SCOPE_PILLS: ReadonlyArray<{ mode: ExploreSearchScope; label: string }> = [
  { mode: 'join', label: EXPLORE_SEARCH_SECTION_TRIPS },
  { mode: 'places', label: EXPLORE_SEARCH_SECTION_SPOTS },
  { mode: 'crew', label: EXPLORE_SEARCH_SECTION_CREW },
];

type ExploreSearchRecommendedScopePillsProps = {
  active: ExploreSearchScope;
  onChange: (mode: ExploreSearchScope) => void;
};

/** Quick scope switch — Trips · Places · Crews · Groups (discoverable clubs). */
export const ExploreSearchRecommendedScopePills = ({
  active,
  onChange,
}: ExploreSearchRecommendedScopePillsProps) => (
  <div className="flex flex-wrap gap-2" role="tablist" aria-label="Search category">
    {RECOMMENDED_SCOPE_PILLS.map(({ mode, label }) => {
      const selected = active === mode;
      return (
        <button
          key={mode}
          type="button"
          role="tab"
          aria-selected={selected}
          onClick={() => onChange(mode)}
          className={listChipClass(selected)}
        >
          {label}
        </button>
      );
    })}
    {FEATURE_FLAGS.communityDiscover ? (
      <button
        type="button"
        role="tab"
        aria-selected={active === 'groups'}
        onClick={() => onChange('groups')}
        className={listChipClass(active === 'groups')}
      >
        {EXPLORE_SEARCH_SECTION_GROUPS}
      </button>
    ) : null}
  </div>
);