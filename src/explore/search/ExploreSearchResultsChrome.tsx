import { Link, useNavigate } from 'react-router-dom';
import {
  EXPLORE_SEARCH_EDIT,
  EXPLORE_SEARCH_RESULT_SCOPES,
  EXPLORE_SEARCH_RESULTS_COUNT,
} from './exploreSearchHomeCopy';
import { ExploreSearchResultsViewToggle } from './ExploreSearchResultsViewToggle';
import { exploreSearchWhenSummary } from './exploreSearchWhenLabel';
import {
  exploreSearchModalEntryPath,
  exploreSearchResultsPath,
  type ExploreSearchBrowseState,
  type ExploreSearchScope,
} from './exploreSearchRouting';
import { formatExploreSearchWhereDisplay } from './exploreSearchWhereDisplay';
import { exploreSearchStateSummary } from './exploreSearchVenueState';
import { useExploreRegionPillOptions } from '../../config/useExploreRegionPillOptions';
import { ProductNavLink } from '../../components/navigation/ProductNavLink';

type ExploreSearchResultsChromeProps = {
  state: ExploreSearchBrowseState;
  tripCount: number;
  placeCount: number;
  loading: boolean;
  crewCount?: number;
};

const tabCount = (
  scope: ExploreSearchScope,
  tripCount: number,
  placeCount: number,
  crewCount: number
): number => {
  if (scope === 'join') return tripCount;
  if (scope === 'places') return placeCount;
  return crewCount;
};

const activeResultCount = (
  scope: ExploreSearchScope,
  tripCount: number,
  placeCount: number,
  crewCount: number
): number => tabCount(scope, tripCount, placeCount, crewCount);

export const ExploreSearchResultsChrome = ({
  state,
  tripCount,
  placeCount,
  loading,
  crewCount = 0,
}: ExploreSearchResultsChromeProps) => {
  const navigate = useNavigate();
  const regionPillOptions = useExploreRegionPillOptions('AE');
  const whereLine = formatExploreSearchWhereDisplay(state.query.trim() || 'Everywhere');
  const contextLine =
    state.searchScope === 'places'
      ? exploreSearchStateSummary(state.venueRegions, regionPillOptions)
      : exploreSearchWhenSummary(state.activityDatePreset);

  const resultsCount = activeResultCount(state.searchScope, tripCount, placeCount, crewCount);
  const mapView = state.view === 'map';

  return (
    <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200/80">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-[15px] font-bold text-neutral-900">{whereLine}</p>
          <p className="text-xs font-medium text-neutral-600">{contextLine}</p>
        </div>
        <ProductNavLink
          to={exploreSearchModalEntryPath(state)}
          className="shrink-0 text-xs font-semibold text-emerald-700"
        >
          {EXPLORE_SEARCH_EDIT}
        </ProductNavLink>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
        <p className="text-sm font-semibold text-neutral-900">
          {loading ? '…' : EXPLORE_SEARCH_RESULTS_COUNT(resultsCount)}
        </p>
        {state.searchScope !== 'crew' ? (
          <ExploreSearchResultsViewToggle
            mode={mapView ? 'map' : 'list'}
            listCount={resultsCount}
            onSelectList={() =>
              navigate(exploreSearchResultsPath({ ...state, view: 'list' }))
            }
            onSelectMap={() =>
              navigate(exploreSearchResultsPath({ ...state, view: 'map' }))
            }
          />
        ) : null}
      </div>

      <div
        className="-mx-0.5 flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none"
        role="tablist"
        aria-label="Result categories"
      >
        {EXPLORE_SEARCH_RESULT_SCOPES.map(({ mode, label }) => {
          const selected = state.searchScope === mode;
          const count = tabCount(mode, tripCount, placeCount, crewCount);
          const countLabel = !loading ? ` (${count})` : '';
          return (
            <Link
              key={mode}
              to={exploreSearchResultsPath({
                ...state,
                searchScope: mode,
                venueRegions: state.venueRegions,
                view: state.view,
              })}
              role="tab"
              aria-selected={selected}
              className={[
                'shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition',
                selected
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-neutral-50 text-neutral-800 ring-1 ring-neutral-200',
              ].join(' ')}
            >
              {label}
              {countLabel}
            </Link>
          );
        })}
      </div>
    </div>
  );
};