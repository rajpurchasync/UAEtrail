import { Link } from 'react-router-dom';
import type { EntityFollowDTO } from '@uaetrail/shared-types';
import { hostBrandProfilePath, placeDetailPath, shopPublicPath } from '@uaetrail/shared-types';
import {
  EXPLORE_PEOPLE_BROWSE_EMPTY_FOLLOWED_HOSTS,
  EXPLORE_PEOPLE_BROWSE_EMPTY_FOLLOWED_PLACES,
  EXPLORE_PEOPLE_BROWSE_LOADING,
} from '../../content/explorePeopleBrowseCopy';
import type { ExploreFollowedSegment } from './useExploreBrowseUrlState';

type ExploreFollowedEntityListProps = {
  segment: ExploreFollowedSegment;
  follows: EntityFollowDTO[];
  loading: boolean;
  error: string | null;
};

export const ExploreFollowedEntityList = ({
  segment,
  follows,
  loading,
  error,
}: ExploreFollowedEntityListProps) => {
  if (loading) {
    return <p className="py-8 text-center text-sm text-gray-500">{EXPLORE_PEOPLE_BROWSE_LOADING}</p>;
  }
  if (error) {
    return <p className="py-8 text-center text-sm text-red-600">{error}</p>;
  }

  const places = follows.filter((f) => f.kind === 'location' && f.location);
  const hosts = follows.filter((f) => (f.kind === 'tenant' && f.tenant) || (f.kind === 'merchant' && f.merchant));

  const rows = segment === 'places' ? places : segment === 'events' ? hosts : [];

  if (segment !== 'people' && rows.length === 0) {
    const empty =
      segment === 'places' ? EXPLORE_PEOPLE_BROWSE_EMPTY_FOLLOWED_PLACES : EXPLORE_PEOPLE_BROWSE_EMPTY_FOLLOWED_HOSTS;
    return (
      <div className="rounded-2xl border border-dashed border-emerald-200/80 bg-emerald-50/30 px-4 py-8 text-center">
        <p className="text-sm text-neutral-600">{empty}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((follow) => {
        if (segment === 'places' && follow.location) {
          const path = placeDetailPath('hiking', follow.location.id);
          return (
            <Link
              key={follow.id}
              to={path}
              className="rounded-2xl border border-neutral-200/90 bg-white p-3 text-sm font-semibold text-gray-900 shadow-sm active:opacity-90"
            >
              {follow.location.name}
            </Link>
          );
        }
        if (segment === 'events' && follow.tenant) {
          const path = hostBrandProfilePath(
            follow.tenant.slug,
            follow.tenant.brandProfileKind ?? 'pro_guide'
          );
          if (!path) return null;
          return (
            <Link
              key={follow.id}
              to={path}
              className="rounded-2xl border border-neutral-200/90 bg-white p-3 text-sm font-semibold text-gray-900 shadow-sm active:opacity-90"
            >
              {follow.tenant.name}
            </Link>
          );
        }
        if (segment === 'events' && follow.merchant) {
          return (
            <Link
              key={follow.id}
              to={shopPublicPath({ merchantId: follow.merchant.id })}
              className="rounded-2xl border border-neutral-200/90 bg-white p-3 text-sm font-semibold text-gray-900 shadow-sm active:opacity-90"
            >
              {follow.merchant.shopName}
            </Link>
          );
        }
        return null;
      })}
    </div>
  );
};
