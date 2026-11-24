import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import type { CommunityDiscoverCardDTO } from '@uaetrail/shared-types';
import { EnvironmentImage } from '@/components/ui/EnvironmentImage';
import { communityJoinPolicyLabel } from '@/content/communityDiscoverCopy';
import { communityClubPath } from '@/config/routingCatalog';

type CommunityDiscoverBrowseListProps = {
  rows: CommunityDiscoverCardDTO[];
  compact?: boolean;
};

export const CommunityDiscoverBrowseList = ({ rows, compact = false }: CommunityDiscoverBrowseListProps) => (
  <ul className={compact ? 'space-y-2' : 'space-y-3'}>
    {rows.map((row) => {
      const area = row.geoRef.names.area || row.geoRef.names.state;
      const geoLabel = [row.geoRef.names.country, area].filter(Boolean).join(' · ');
      return (
        <li key={row.id}>
          <Link
            to={communityClubPath(row.slug)}
            className="group flex overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200/80 transition hover:ring-emerald-300/80"
          >
            <div
              className={
                compact
                  ? 'relative h-20 w-24 shrink-0 bg-gradient-to-br from-emerald-900 to-neutral-900'
                  : 'relative h-24 w-28 shrink-0 bg-gradient-to-br from-emerald-900 to-neutral-900 sm:h-28 sm:w-36'
              }
            >
              {row.bannerUrl ? (
                <EnvironmentImage
                  src={row.bannerUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" aria-hidden />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2.5 sm:px-4 sm:py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{geoLabel}</p>
              <p className="mt-0.5 text-sm font-semibold text-neutral-900 group-hover:text-emerald-900 sm:text-base">
                {row.name}
              </p>
              {row.summary ? (
                <p className="mt-1 line-clamp-2 text-xs text-neutral-600 sm:text-sm">{row.summary}</p>
              ) : null}
              <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 sm:text-xs">
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