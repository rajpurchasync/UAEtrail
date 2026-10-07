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
    <ListDiscoveryExperience surface="standalone" />
  </>
);
