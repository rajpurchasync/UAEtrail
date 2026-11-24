import { MapPin, Route, Users } from 'lucide-react';
import type { ExploreSearchScope } from './exploreSearchRouting';
import { EXPLORE_SEARCH_SCOPE_TAB, EXPLORE_SEARCH_SCOPE_TAB_ROWS } from './exploreSearchScopeTabs';

const SCOPE_ICONS = {
  join: Route,
  places: MapPin,
  crew: Users,
} as const satisfies Record<ExploreSearchScope, typeof Route>;

type ExploreSearchScopePillsProps = {
  active: ExploreSearchScope;
  onChange: (mode: ExploreSearchScope) => void;
};

/** Booking search — equal-width underlined tabs with icons (Trips · Places · Go with). */
export const ExploreSearchScopePills = ({ active, onChange }: ExploreSearchScopePillsProps) => (
  <div className={EXPLORE_SEARCH_SCOPE_TAB.row} role="tablist" aria-label="Search scope">
    {EXPLORE_SEARCH_SCOPE_TAB_ROWS.map(({ mode, label }) => {
      const selected = active === mode;
      const Icon = SCOPE_ICONS[mode];
      return (
        <button
          key={mode}
          type="button"
          role="tab"
          aria-selected={selected}
          onClick={() => onChange(mode)}
          className={`${EXPLORE_SEARCH_SCOPE_TAB.button} ${
            selected ? EXPLORE_SEARCH_SCOPE_TAB.active : EXPLORE_SEARCH_SCOPE_TAB.inactive
          }`}
        >
          <Icon
            className={`${EXPLORE_SEARCH_SCOPE_TAB.icon} ${
              selected ? EXPLORE_SEARCH_SCOPE_TAB.activeIcon : EXPLORE_SEARCH_SCOPE_TAB.inactiveIcon
            }`}
            strokeWidth={selected ? 2.25 : 2}
            aria-hidden
          />
          <span className={EXPLORE_SEARCH_SCOPE_TAB.label}>{label}</span>
        </button>
      );
    })}
  </div>
);