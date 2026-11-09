import { Link } from 'react-router-dom';
import { BUDDIES_PATH, GROUPS_PATH } from '../../config/routingCatalog';
import {
  PRODUCT_FRIENDS_SURFACE_LABEL,
  PRODUCT_GROUPS_SURFACE_LABEL,
} from '../../content/productNorthStar';
import { listPeopleDiscoveryPath } from '../../list/routing';

export type SocialHubTab = 'people' | 'friends' | 'groups';

const SOCIAL_HUB_TABS: readonly { id: SocialHubTab; label: string; to: string }[] = [
  { id: 'people', label: 'People', to: listPeopleDiscoveryPath() },
  { id: 'friends', label: PRODUCT_FRIENDS_SURFACE_LABEL, to: BUDDIES_PATH },
  { id: 'groups', label: PRODUCT_GROUPS_SURFACE_LABEL, to: GROUPS_PATH },
];

/** Friends · Groups · people discovery — one hub, existing routes. */
export const SocialHubNav = ({ active }: { active: SocialHubTab }) => (
  <nav
    aria-label="Social"
    className="flex w-full min-w-0 max-w-full border-b border-gray-200"
  >
    {SOCIAL_HUB_TABS.map((tab) => {
      const isActive = tab.id === active;
      return (
        <Link
          key={tab.id}
          to={tab.to}
          aria-current={isActive ? 'page' : undefined}
          className={`min-w-0 flex-1 truncate border-b-2 -mb-px px-3 py-2.5 text-center text-sm font-medium transition-colors sm:px-4 ${
            isActive
              ? 'border-emerald-600 bg-emerald-50/50 text-emerald-700'
              : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          {tab.label}
        </Link>
      );
    })}
  </nav>
);
