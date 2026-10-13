import { PageMeta } from '../components/seo/PageMeta';
import { LIST_DISCOVERY_PATH } from '../config/platform';
import { ListDiscoveryExperience } from './ListDiscoveryExperience';

export const BrowseListPage = () => (
  <>
    <PageMeta
      title="Discover outdoor plans"
      description="Find people and plans to get outside together."
      path={LIST_DISCOVERY_PATH}
    />
    <div className="flex min-h-0 flex-1 flex-col max-md:h-[calc(100dvh-var(--bottom-nav-height,56px)-3.5rem-var(--safe-top,0px))] md:min-h-[calc(100dvh-4rem)]">
      <ListDiscoveryExperience surface="standalone" />
    </div>
  </>
);
