import { Link } from 'react-router-dom';
import type { MemberBrowseCardDTO, MemberDiscoveryQuotaDTO } from '@uaetrail/shared-types';
import { UserPlus } from 'lucide-react';
import { SecureAvatar } from '../../components/ui';
import { PRO_MEMBERSHIP_PATH } from '../../config/routingCatalog';
import {
  WHOS_GOING_DISCOVER_EMPTY_DIRECTORY,
  WHOS_GOING_DISCOVER_LOADING,
  WHOS_GOING_DISCOVER_QUOTA_UPGRADE_LINK,
  WHOS_GOING_DISCOVER_QUOTA_UPGRADE_SUFFIX,
  whosGoingDiscoverQuotaLine,
} from '../../content/whosGoingCopy';
import { ExploreGuestSignInCard } from './ExploreGuestSignInCard';
import type { WhosGoingDiscoverTripRow } from '../whosGoingDiscover';

type ExploreWhosGoingDiscoverListProps = {
  isSignedIn: boolean;
  loading: boolean;
  error: string | null;
  quota: MemberDiscoveryQuotaDTO | null;
  onTrips: WhosGoingDiscoverTripRow[];
  directory: MemberBrowseCardDTO[];
  onOpenTrip: (activityId: string) => void;
};

const discoverProfileHref = (userId: string): string => `/member/${userId}?discover=1`;

export const ExploreWhosGoingDiscoverList = ({
  isSignedIn,
  loading,
  error,
  quota,
  onTrips,
  directory,
  onOpenTrip,
}: ExploreWhosGoingDiscoverListProps) => {
  if (!isSignedIn) {
    return <ExploreGuestSignInCard intent="whos-going" compact />;
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-gray-500">{WHOS_GOING_DISCOVER_LOADING}</p>;
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-red-600">{error}</p>;
  }

  const quotaLine =
    quota && quota.limit != null
      ? whosGoingDiscoverQuotaLine(quota.remaining ?? 0, quota.limit)
      : null;

  return (
    <div className="space-y-5">
      {quotaLine ? (
        <p className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-900">
          {quotaLine}
          {quota?.remaining === 0 ? (
            <>
              {' '}
              <Link to={PRO_MEMBERSHIP_PATH} className="font-semibold underline">
                {WHOS_GOING_DISCOVER_QUOTA_UPGRADE_LINK}
              </Link>{' '}
              {WHOS_GOING_DISCOVER_QUOTA_UPGRADE_SUFFIX}
            </>
          ) : null}
        </p>
      ) : null}

      {onTrips.length > 0 ? (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            On upcoming trips
          </h3>
          <ul className="space-y-2">
            {onTrips.map((row) => (
              <li
                key={`${row.userId}-${row.activityId}`}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200/75 bg-white p-3"
              >
                <Link to={discoverProfileHref(row.userId)} className="shrink-0">
                  <SecureAvatar
                    src={row.avatarUrl}
                    name={row.displayName}
                    className="h-11 w-11 ring-2 ring-white"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to={discoverProfileHref(row.userId)}
                    className="block truncate text-sm font-semibold text-neutral-900 hover:text-emerald-700 hover:underline"
                  >
                    {row.displayName}
                  </Link>
                  <button
                    type="button"
                    onClick={() => onOpenTrip(row.activityId)}
                    className="mt-0.5 truncate text-left text-xs text-emerald-700 hover:underline"
                  >
                    Joining · {row.activityTitle}
                  </button>
                </div>
                <UserPlus className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Members
        </h3>
        {directory.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">{WHOS_GOING_DISCOVER_EMPTY_DIRECTORY}</p>
        ) : (
          <ul className="space-y-2">
            {directory.map((card) => (
              <li
                key={card.id}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200/75 bg-white p-3"
              >
                <Link to={discoverProfileHref(card.id)} className="shrink-0">
                  <SecureAvatar
                    src={card.avatarUrl}
                    name={card.displayName}
                    className="h-11 w-11 ring-2 ring-white"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to={discoverProfileHref(card.id)}
                    className="block truncate text-sm font-semibold text-neutral-900 hover:text-emerald-700 hover:underline"
                  >
                    {card.displayName}
                  </Link>
                  {card.city ? <p className="text-xs text-neutral-500">{card.city}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
