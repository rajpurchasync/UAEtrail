import { EXPLORE_CREWS_TAB_DISCOVER } from '@/content/exploreCrewsCopy';
import { FEATURE_FLAGS } from '@/config/platform';
import { useCommunityDiscoverList } from '@/crew-discovery/hooks/useCommunityDiscoverList';
import { CommunityDiscoverBrowseList } from './CommunityDiscoverBrowseList';

const CommunityDirectoryPlaceholder = () => (
  <div className="rounded-2xl bg-gradient-to-br from-emerald-50/80 to-white px-4 py-8 text-center ring-1 ring-neutral-200/80">
    <p className="text-base font-semibold text-neutral-900">{EXPLORE_CREWS_TAB_DISCOVER} communities</p>
    <p className="mt-2 text-sm text-neutral-600">
      Club directories and join flows ship with community discover. Private teams stay in My crew → Groups.
    </p>
  </div>
);

export const CrewsCommunityBody = () => {
  if (!FEATURE_FLAGS.communityDiscover) {
    return <CommunityDirectoryPlaceholder />;
  }

  const { data, isPending, error } = useCommunityDiscoverList(true);

  if (isPending) {
    return (
      <div className="rounded-2xl bg-white px-4 py-8 text-center ring-1 ring-neutral-200/80">
        <p className="text-sm text-neutral-600">Loading communities…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white px-4 py-8 text-center ring-1 ring-neutral-200/80">
        <p className="text-sm text-red-600">Could not load communities. Try again in a moment.</p>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50/80 to-white px-4 py-8 text-center ring-1 ring-neutral-200/80">
        <p className="text-base font-semibold text-neutral-900">No communities yet</p>
        <p className="mt-2 text-sm text-neutral-600">
          Discoverable clubs will show here — sorted by country and city. Private teams stay in Groups.
        </p>
      </div>
    );
  }

  return <CommunityDiscoverBrowseList rows={data} />;
};