import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EXPLORE_SEARCH_RECENT_TITLE } from '../hub/exploreHubHomeCopy';
import { exploreHubHomePlaceLabel, exploreHubHomeWhenSummary } from '../hub/exploreHubHomeWhenLabel';
import { exploreHubHomeStateSummary } from '../hub/exploreHubVenueState';
import {
  exploreSearchStorageScope,
  readExploreRecentSearches,
} from '../hub/exploreHubLastSearch';
import { exploreSearchResultsPath } from './exploreSearchRouting';

type ExploreBookingRecentSearchesProps = {
  onPick: () => void;
  refreshKey?: number;
};

/** Latest committed searches — max 3, no map match hints. */
export const ExploreBookingRecentSearches = ({ onPick, refreshKey = 0 }: ExploreBookingRecentSearchesProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const storageScope = exploreSearchStorageScope(user?.id);
  const recent = useMemo(
    () => readExploreRecentSearches(3, storageScope),
    [refreshKey, storageScope]
  );

  if (recent.length === 0) return null;

  return (
    <section aria-labelledby="explore-recent-searches" className="space-y-2">
      <h2 id="explore-recent-searches" className="text-sm font-bold text-neutral-900">
        {EXPLORE_SEARCH_RECENT_TITLE}
      </h2>
      <ul className="space-y-2">
        {recent.map((entry) => {
          const where = exploreHubHomePlaceLabel(entry.query);
          const secondLine =
            entry.hubMode === 'places'
              ? exploreHubHomeStateSummary(entry.venueRegions ?? [])
              : exploreHubHomeWhenSummary(entry.activityDatePreset);
          const key = `${entry.hubMode}|${entry.query}|${entry.activityDatePreset}|${(entry.venueRegions ?? []).join(',')}`;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => {
                  navigate(
                    exploreSearchResultsPath({
                      query: entry.query,
                      activityDatePreset: entry.activityDatePreset,
                      searchScope: entry.hubMode,
                      venueRegions: entry.venueRegions ?? [],
                    })
                  );
                  onPick();
                }}
                className="flex w-full items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-3.5 text-left ring-1 ring-neutral-200/80 active:bg-neutral-100"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-neutral-900">{where}</p>
                  <p className="text-xs font-medium text-neutral-600">
                    {secondLine}
                    {entry.hubMode !== 'places' && !entry.query.trim() ? ' · everywhere' : ''}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};