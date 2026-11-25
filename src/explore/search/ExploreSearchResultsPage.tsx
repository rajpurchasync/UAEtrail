import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { PageMeta } from '../../components/seo/PageMeta';
import { LIST_CHROME } from '../../discovery/discoverySession';
import { useProductSearchParams } from '../../routing/useEffectiveLocation';
import {
  EXPLORE_SEARCH_RESULTS_PATH,
  isExploreSearchHomeState,
  parseExploreSearchBrowseState,
} from './exploreSearchRouting';
import { EXPLORE_SEARCH_HOME_TITLE, EXPLORE_SEARCH_RESULTS_TITLE } from './exploreSearchHomeCopy';
import { CreateFlowProvider } from '../../create/CreateFlowProvider';
import { ExploreSearchResults } from './ExploreSearchResults';
import { ExploreSearchHome } from './ExploreSearchHome';
import { ExploreSearchInboundRedirectHost } from './ExploreSearchInboundRedirectHost';
import { ExploreSearchPageLayout } from './ExploreSearchPageLayout.tsx';

export const ExploreSearchResultsPage = () => {
  const { pathname } = useLocation();
  const [searchParams] = useProductSearchParams();
  const state = useMemo(() => parseExploreSearchBrowseState(searchParams), [searchParams]);
  const searchHome = useMemo(
    () => isExploreSearchHomeState(pathname, searchParams),
    [pathname, searchParams]
  );

  return (
    <CreateFlowProvider>
      <ExploreSearchInboundRedirectHost />
      <div
        {...(searchHome ? { 'data-explore-search-compose': '' } : { 'data-explore-search-results': '' })}
        className={`flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${LIST_CHROME.pageBg}`}
      >
        <PageMeta
          title={searchHome ? EXPLORE_SEARCH_HOME_TITLE : EXPLORE_SEARCH_RESULTS_TITLE}
          description="Trips, places, and crew options for your search."
          path={EXPLORE_SEARCH_RESULTS_PATH}
        />
        <ExploreSearchPageLayout variant={searchHome ? 'home' : 'results'}>
          {searchHome ? <ExploreSearchHome /> : <ExploreSearchResults state={state} />}
        </ExploreSearchPageLayout>
      </div>
    </CreateFlowProvider>
  );
};