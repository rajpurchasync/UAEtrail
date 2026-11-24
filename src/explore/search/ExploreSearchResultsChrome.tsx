import { useNavigate } from 'react-router-dom';
import {
  EXPLORE_SEARCH_EDIT,
  EXPLORE_SEARCH_RESULTS_COUNT,
  EXPLORE_SEARCH_SECTION_CREW,
  EXPLORE_SEARCH_SECTION_GROUPS,
  EXPLORE_SEARCH_SECTION_SPOTS,
  EXPLORE_SEARCH_SECTION_TRIPS,
} from './exploreSearchHomeCopy';
import { ExploreSearchResultsViewToggle } from './ExploreSearchResultsViewToggle';
import {
  exploreSearchModalEntryPath,
  exploreSearchResultsPath,
  type ExploreSearchBrowseState,
  type ExploreSearchScope,
} from './exploreSearchRouting';
import { exploreSearchWhenSummary } from './exploreSearchWhenLabel';
import { formatExploreSearchWhereDisplay } from './exploreSearchWhereDisplay';
import { exploreSearchStateSummary } from './exploreSearchVenueState';
import { useExploreRegionPillOptions } from '../../config/useExploreRegionPillOptions';
import { ProductNavLink } from '../../components/navigation/ProductNavLink';
import { listChipClass } from '../../list/browse/listChromeTheme';
import { FEATURE_FLAGS } from '../../config/platform';

type ExploreSearchResultsChromeProps = {
  state: ExploreSearchBrowseState;
  tripCount: number;
  placeCount: number;
  loading: boolean;
  crewCount?: number;
  groupsCount?: number;
  groupsLoading?: boolean;
};

const resultScopePills = (): ReadonlyArray<{ mode: ExploreSearchScope; label: string }> => {
  const pills: Array<{ mode: ExploreSearchScope; label: string }> = [
    { mode: 'join', label: EXPLORE_SEARCH_SECTION_TRIPS },
    { mode: 'places', label: EXPLORE_SEARCH_SECTION_SPOTS },
    { mode: 'crew', label: EXPLORE_SEARCH_SECTION_CREW },
  ];
  if (FEATURE_FLAGS.communityDiscover) {
    pills.push({ mode: 'groups', label: EXPLORE_SEARCH_SECTION_GROUPS });
  }
  return pills;
};

const tabCount = (
  scope: ExploreSearchScope,
  tripCount: number,
  placeCount: number,
  crewCount: number,
  groupsCount: number
): number => {
  if (scope === 'join') return tripCount;
  if (scope === 'places') return placeCount;
  if (scope === 'groups') return groupsCount;
  return crewCount;
};

const activeResultCount = (
  scope: ExploreSearchScope,
  tripCount: number,
  placeCount: number,
  crewCount: number,
  groupsCount: number
): number => tabCount(scope, tripCount, placeCount, crewCount, groupsCount);

export const ExploreSearchResultsChrome = ({
  state,
  tripCount,
  placeCount,
  loading,
  crewCount = 0,
  groupsCount = 0,
  groupsLoading = false,
}: ExploreSearchResultsChromeProps) => {
  const navigate = useNavigate();
  const regionPillOptions = useExploreRegionPillOptions('AE');
  const whereLine = formatExploreSearchWhereDisplay(state.query.trim() || 'Everywhere');
  const contextLine =
    state.searchScope === 'places'
      ? exploreSearchStateSummary(state.venueRegions, regionPillOptions)
      : exploreSearchWhenSummary(state.activityDatePreset);

  const chromeLoading = state.searchScope === 'groups' ? groupsLoading : loading;
  const resultsCount = activeResultCount(
    state.searchScope,
    tripCount,
    placeCount,
    crewCount,
    groupsCount
  );
  const mapView = state.view === 'map';

  return (
    <div className="shrink-0 space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200/80">
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

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Result categories">
        {resultScopePills().map(({ mode, label }) => {
          const selected = state.searchScope === mode;
          const count = tabCount(mode, tripCount, placeCount, crewCount, groupsCount);
          const countLabel = !chromeLoading ? ` · ${count}` : '';
          return (
            <ProductNavLink
              key={mode}
              to={exploreSearchResultsPath({
                ...state,
                searchScope: mode,
                venueRegions: state.venueRegions,
                view: state.view,
              })}
              role="tab"
              aria-selected={selected}
              className={`${listChipClass(selected)} no-underline`}
            >
              {label}
              {countLabel}
            </ProductNavLink>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
        <p className="text-sm font-semibold text-neutral-900">
          {chromeLoading ? '…' : EXPLORE_SEARCH_RESULTS_COUNT(resultsCount)}
        </p>
        {state.searchScope !== 'crew' && state.searchScope !== 'groups' ? (
          <ExploreSearchResultsViewToggle
            mode={mapView ? 'map' : 'list'}
            listCount={resultsCount}
            onSelectList={() => navigate(exploreSearchResultsPath({ ...state, view: 'list' }))}
            onSelectMap={() => navigate(exploreSearchResultsPath({ ...state, view: 'map' }))}
          />
        ) : null}
      </div>
    </div>
  );
};