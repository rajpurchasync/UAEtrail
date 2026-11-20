import { useMemo } from 'react';
import { PageMeta } from '../../components/seo/PageMeta';
import { APP_SCROLL_BODY_CLASS } from '../../config/layoutScroll';
import { LIST_CHROME } from '../../list/listChromeTheme';
import { useProductSearchParams } from '../../routing/useEffectiveLocation';
import { EXPLORE_SEARCH_RESULTS_PATH, parseExploreSearchBrowseState } from './exploreSearchRouting';
import { EXPLORE_HUB_SEARCH_RESULTS_TITLE } from '../hub/exploreHubHomeCopy';
import { CreateFlowProvider } from '../../create/CreateFlowProvider';
import { ExploreSearchResults } from './ExploreSearchResults';

export const ExploreSearchResultsPage = () => {
  const [searchParams] = useProductSearchParams();
  const state = useMemo(() => parseExploreSearchBrowseState(searchParams), [searchParams]);

  return (
    <CreateFlowProvider>
      <div
        data-explore-search-results
        className={`flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${LIST_CHROME.pageBg}`}
      >
        <PageMeta
          title={EXPLORE_HUB_SEARCH_RESULTS_TITLE}
          description="Trips, places, and crew options for your search."
          path={EXPLORE_SEARCH_RESULTS_PATH}
        />
        <div
          className={`${APP_SCROLL_BODY_CLASS} flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 pb-nav-safe pt-3 md:px-5`}
        >
          <ExploreSearchResults state={state} />
        </div>
      </div>
    </CreateFlowProvider>
  );
};