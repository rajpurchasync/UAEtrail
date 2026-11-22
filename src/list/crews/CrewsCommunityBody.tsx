import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { EnvironmentImage } from '@/components/ui/EnvironmentImage';
import { EXPLORE_CREWS_TAB_DISCOVER } from '@/content/exploreCrewsCopy';
import { communityJoinPolicyLabel } from '@/content/communityDiscoverCopy';
import { FEATURE_FLAGS } from '@/config/platform';
import { communityClubPath } from '@/config/routingCatalog';
import { useCommunityDiscoverList } from '@/crew-discovery/hooks/useCommunityDiscoverList';

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

  return (
    <ul className="space-y-3">
      {data.map((row) => {
        const area = row.geoRef.names.area || row.geoRef.names.state;
        const geoLabel = [row.geoRef.names.country, area].filter(Boolean).join(' · ');
        return (
          <li key={row.id}>
            <Link
              to={communityClubPath(row.slug)}
              className="group flex overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/80 transition hover:ring-emerald-300/80"
            >
              <div className="relative h-24 w-28 shrink-0 bg-gradient-to-br from-emerald-900 to-neutral-900 sm:h-28 sm:w-36">
                {row.bannerUrl ? (
                  <EnvironmentImage
                    src={row.bannerUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" aria-hidden />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{geoLabel}</p>
                <p className="mt-0.5 text-base font-semibold text-neutral-900 group-hover:text-emerald-900">
                  {row.name}
                </p>
                {row.summary ? (
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{row.summary}</p>
                ) : null}
                <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    {row.memberCount}
                  </span>
                  <span className="text-neutral-300">·</span>
                  <span>{communityJoinPolicyLabel(row.joinPolicy)}</span>
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};