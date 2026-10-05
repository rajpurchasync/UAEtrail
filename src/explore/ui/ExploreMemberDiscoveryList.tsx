import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import type {
  MemberBrowseCardDTO,
  MemberDiscoveryOnTripRowDTO,
  MemberDiscoveryQuotaDTO,
} from '@uaetrail/shared-types';
import { SecureAvatar } from '../../components/ui';
import { proMembershipPath } from '../../config/routingCatalog';
import { memberDiscoverProfilePath } from '../memberDiscoveryExplore';
import { ExploreGuestSignInCard } from './ExploreGuestSignInCard';
import {
  EXPLORE_SOCIAL_DISCOVER_DIRECTORY_TITLE,
  EXPLORE_SOCIAL_DISCOVER_ON_TRIPS_TITLE,
  EXPLORE_SOCIAL_EMPTY_DISCOVER,
  EXPLORE_SOCIAL_LOADING,
  exploreSocialDiscoverQuotaLine,
} from '../../content/exploreSocialPanelCopy';
import {
  MEMBER_DISCOVERY_QUOTA_GATE_BODY,
  MEMBER_DISCOVERY_QUOTA_GATE_CTA,
  MEMBER_DISCOVERY_QUOTA_GATE_TITLE,
} from '../../content/exploreGoingPanelCopy';

type ExploreMemberDiscoveryListProps = {
  onTrips: MemberDiscoveryOnTripRowDTO[];
  directory: MemberBrowseCardDTO[];
  quota: MemberDiscoveryQuotaDTO | null;
  loading: boolean;
  error: string | null;
  isSignedIn: boolean;
  onOpenActivity: (activityId: string) => void;
};

export const ExploreMemberDiscoveryList = ({
  onTrips,
  directory,
  quota,
  loading,
  error,
  isSignedIn,
  onOpenActivity,
}: ExploreMemberDiscoveryListProps) => {
  if (!isSignedIn) {
    return <ExploreGuestSignInCard intent="explore-social" compact />;
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-gray-500">{EXPLORE_SOCIAL_LOADING}</p>;
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-red-600">{error}</p>;
  }

  const quotaExhausted =
    quota != null && quota.limit != null && quota.remaining != null && quota.remaining <= 0;

  const hasRows = onTrips.length > 0 || directory.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {quota ? (
        <p className="text-xs font-medium text-neutral-600">{exploreSocialDiscoverQuotaLine(quota)}</p>
      ) : null}

      {quotaExhausted ? (
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/80 px-4 py-3">
          <p className="text-sm font-bold text-amber-950">{MEMBER_DISCOVERY_QUOTA_GATE_TITLE}</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/90">{MEMBER_DISCOVERY_QUOTA_GATE_BODY}</p>
          <Link
            to={proMembershipPath({ intent: 'discover-members' })}
            className="mt-2 inline-block text-sm font-semibold text-emerald-700 hover:underline"
          >
            {MEMBER_DISCOVERY_QUOTA_GATE_CTA}
          </Link>
        </div>
      ) : null}

      {!hasRows ? (
        <div className="rounded-2xl border border-dashed border-emerald-200/80 bg-emerald-50/30 px-4 py-8 text-center">
          <p className="text-sm text-neutral-600">{EXPLORE_SOCIAL_EMPTY_DISCOVER}</p>
        </div>
      ) : null}

      {onTrips.length > 0 ? (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
            {EXPLORE_SOCIAL_DISCOVER_ON_TRIPS_TITLE}
          </h3>
          <ul className="flex flex-col gap-2">
            {onTrips.map((row) => (
              <li key={`${row.userId}-${row.activityId}`}>
                <article className="rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm">
                  <div className="flex min-w-0 items-start gap-3">
                    {quotaExhausted ? (
                      <span className="flex min-w-0 flex-1 items-start gap-3 opacity-70">
                        <SecureAvatar
                          src={row.avatarUrl}
                          name={row.displayName}
                          className="h-11 w-11 shrink-0 text-sm"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-neutral-900">
                            {row.displayName}
                          </span>
                          <span className="mt-0.5 block text-xs text-neutral-600">{row.activityTitle}</span>
                        </span>
                      </span>
                    ) : (
                      <Link
                        to={memberDiscoverProfilePath(row.userId)}
                        className="flex min-w-0 flex-1 items-start gap-3 active:opacity-90"
                      >
                        <SecureAvatar
                          src={row.avatarUrl}
                          name={row.displayName}
                          className="h-11 w-11 shrink-0 text-sm"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-neutral-900">
                            {row.displayName}
                          </span>
                          <span className="mt-0.5 block text-xs text-neutral-600">{row.activityTitle}</span>
                        </span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenActivity(row.activityId)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-50"
                    >
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                      Map
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {directory.length > 0 ? (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
            {EXPLORE_SOCIAL_DISCOVER_DIRECTORY_TITLE}
          </h3>
          <ul className="flex flex-col gap-2">
            {directory.map((member) => (
              <li key={member.id}>
                {quotaExhausted ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white p-3 opacity-70">
                    <SecureAvatar
                      src={member.avatarUrl}
                      name={member.displayName}
                      className="h-11 w-11 text-sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900">{member.displayName}</p>
                      {member.city ? (
                        <p className="truncate text-xs text-neutral-600">{member.city}</p>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <Link
                    to={memberDiscoverProfilePath(member.id)}
                    className="flex items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm active:opacity-90"
                  >
                    <SecureAvatar
                      src={member.avatarUrl}
                      name={member.displayName}
                      className="h-11 w-11 text-sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900">{member.displayName}</p>
                      {member.city ? (
                        <p className="truncate text-xs text-neutral-600">{member.city}</p>
                      ) : null}
                    </div>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
};
