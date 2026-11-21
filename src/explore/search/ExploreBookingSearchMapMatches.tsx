import {
  EXPLORE_SEARCH_SCOPE_COPY,
  type ExploreSearchScopeCounts,
  type ExploreSearchScopeKey,
} from '../exploreBrowseTaxonomy';
import { exploreSearchScopeUsesMapMatchCounts } from '../exploreSearchScopeUi';
import { EXPLORE_TYPE } from '../../config/exploreTheme';
import {
  EXPLORE_SEARCH_SECTION_CREW,
  EXPLORE_SEARCH_SECTION_SPOTS,
  EXPLORE_SEARCH_SECTION_TRIPS,
} from './exploreSearchHomeCopy';
import type { ExploreSearchScope } from './exploreSearchRouting';

const BOOKING_MATCH_COUNT_KEYS: readonly ExploreSearchScopeKey[] = ['activities', 'places', 'people'];

const BOOKING_MATCH_LABEL: Record<(typeof BOOKING_MATCH_COUNT_KEYS)[number], string> = {
  activities: EXPLORE_SEARCH_SECTION_TRIPS,
  places: EXPLORE_SEARCH_SECTION_SPOTS,
  people: EXPLORE_SEARCH_SECTION_CREW,
};

export const exploreBookingScopeFromMatchKey = (key: ExploreSearchScopeKey): ExploreSearchScope => {
  if (key === 'places') return 'places';
  if (key === 'people') return 'crew';
  return 'join';
};

const formatCount = (count: number) => (count === 1 ? '1 match' : `${count} matches`);

type ExploreBookingSearchMapMatchesProps = {
  counts: ExploreSearchScopeCounts;
  signedIn?: boolean;
  onPick: (scope: ExploreSearchScope) => void;
};

/** Booking search — always Trips · Places · Crews (map pin counts where applicable). */
export const ExploreBookingSearchMapMatches = ({
  counts,
  signedIn = true,
  onPick,
}: ExploreBookingSearchMapMatchesProps) => {
  const rows = BOOKING_MATCH_COUNT_KEYS.filter((key) => signedIn || key !== 'people');

  return (
    <ul className="divide-y divide-neutral-100" role="listbox" aria-label="Matches on the map">
      {rows.map((scopeKey) => {
        const label = BOOKING_MATCH_LABEL[scopeKey];
        const description = EXPLORE_SEARCH_SCOPE_COPY[scopeKey].description;
        const count = counts[scopeKey];
        const usesMapCounts = exploreSearchScopeUsesMapMatchCounts(scopeKey);
        const countLabel = usesMapCounts ? formatCount(count) : 'Search';

        return (
          <li key={scopeKey} role="presentation">
            <button
              type="button"
              role="option"
              onClick={() => onPick(exploreBookingScopeFromMatchKey(scopeKey))}
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-neutral-50 active:bg-neutral-100"
            >
              <span className="min-w-0">
                <span className={`block text-sm font-bold ${EXPLORE_TYPE.title}`}>{label}</span>
                <span className={`block truncate text-xs font-medium ${EXPLORE_TYPE.muted}`}>{description}</span>
              </span>
              <span className={`shrink-0 text-xs font-bold tabular-nums ${EXPLORE_TYPE.body}`}>
                {countLabel}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};