import { PageMeta } from '../components/seo/PageMeta';
import { LIST_DISCOVERY_PATH } from '../config/platform';
import { ExploreBookingSearchModalHost } from '../explore/search/ExploreBookingSearchModalHost';
import { ListDiscoveryExperience } from './ListDiscoveryExperience';
import '../styles/explore-map-chrome.css';

export const BrowseListPage = () => (
  <>
    <PageMeta
      title="Discover outdoor plans"
      description="Find people and plans to get outside together."
      path={LIST_DISCOVERY_PATH}
    />
    <ExploreBookingSearchModalHost />
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <ListDiscoveryExperience surface="standalone" />
    </div>
  </>
);
