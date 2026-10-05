import { useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  MemberBrowseCardDTO,
  MemberDiscoveryOnTripRowDTO,
  MemberDiscoveryQuotaDTO,
} from '@uaetrail/shared-types';
import { UserPlus } from 'lucide-react';
import { SecureAvatar } from '../../components/ui';
import { EXPLORE_MAP_PATH, proMembershipPath } from '../../config/routingCatalog';
import {
  MEMBER_DISCOVERY_DIRECTORY_EMPTY,
  MEMBER_DISCOVERY_EMPTY_ALL_BODY,
  MEMBER_DISCOVERY_EMPTY_ALL_TITLE,
  MEMBER_DISCOVERY_ON_TRIPS_EMPTY,
  MEMBER_DISCOVERY_QUOTA_UPGRADE_LINK,
  MEMBER_DISCOVERY_QUOTA_UPGRADE_SUFFIX,
  MEMBER_DISCOVERY_ROSTER_LOADING,
  memberDiscoveryQuotaExhaustedNudge,
  memberDiscoveryQuotaLine,
  MEMBER_DISCOVERY_CONNECT,
  MEMBER_DISCOVERY_CONNECT_ERROR,
  MEMBER_DISCOVERY_CONNECT_PENDING,
  memberDiscoveryConnectSent,
} from '../../content/exploreGoingPanelCopy';
import { ExploreGuestSignInCard } from './ExploreGuestSignInCard';
import { memberDiscoverProfilePath } from '../memberDiscoveryExplore';
import { api } from '../../api/index';

const discoverProUpgradeHref = proMembershipPath({
  intent: 'discover-members',
  redirect: `${EXPLORE_MAP_PATH}?view=going&goingTab=discover`,
});

type ExploreMemberDiscoveryListProps = {
  isSignedIn: boolean;
  loading: boolean;
  error: string | null;
  quota: MemberDiscoveryQuotaDTO | null;
  onTrips: MemberDiscoveryOnTripRowDTO[];
  directory: MemberBrowseCardDTO[];
  onOpenTrip: (activityId: string) => void;
};

export const ExploreMemberDiscoveryList = ({
  isSignedIn,
  loading,
  error,
  quota,
  onTrips,
  directory,
  onOpenTrip,
}: ExploreMemberDiscoveryListProps) => {
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [pendingUserIds, setPendingUserIds] = useState<Set<string>>(() => new Set());
  const [connectNotice, setConnectNotice] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  const sendConnect = async (userId: string, displayName: string) => {
    setBusyUserId(userId);
    setConnectError(null);
    setConnectNotice(null);
    try {
      const res = await api.sendBuddyRequest({ targetUserId: userId });
      if (res.data.status === 'accepted') {
        setConnectNotice(`You and ${displayName} are now buddies.`);
      } else {
        setPendingUserIds((prev) => new Set(prev).add(userId));
        setConnectNotice(memberDiscoveryConnectSent(displayName));
      }
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : MEMBER_DISCOVERY_CONNECT_ERROR);
    } finally {
      setBusyUserId(null);
    }
  };

  if (!isSignedIn) {
    return <ExploreGuestSignInCard intent="explore-going" compact />;
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-gray-500">{MEMBER_DISCOVERY_ROSTER_LOADING}</p>;
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-red-600">{error}</p>;
  }

  const quotaLimited = quota?.limit != null;
  const quotaExhausted = quotaLimited && quota.remaining === 0;
  const quotaLine =
    quotaLimited && !quotaExhausted
      ? memberDiscoveryQuotaLine(quota.remaining ?? 0, quota.limit!)
      : null;

  if (onTrips.length === 0 && directory.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-emerald-200/80 bg-emerald-50/30 px-4 py-10 text-center">
        <p className="text-sm font-semibold text-neutral-900">{MEMBER_DISCOVERY_EMPTY_ALL_TITLE}</p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{MEMBER_DISCOVERY_EMPTY_ALL_BODY}</p>
      </div>
    );
  }

  const connectButton = (userId: string, displayName: string) => {
    if (pendingUserIds.has(userId)) {
      return (
        <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
          {MEMBER_DISCOVERY_CONNECT_PENDING}
        </span>
      );
    }
    return (
      <button
        type="button"
        disabled={busyUserId === userId}
        onClick={() => void sendConnect(userId, displayName)}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        <UserPlus className="h-3.5 w-3.5" aria-hidden />
        {MEMBER_DISCOVERY_CONNECT}
      </button>
    );
  };

  return (
    <div className="space-y-5">
      {connectNotice ? (
        <p className="rounded-xl border border-emerald-100 bg-emerald-50/90 px-3 py-2 text-xs font-medium text-emerald-900">
          {connectNotice}
        </p>
      ) : null}
      {connectError ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{connectError}</p>
      ) : null}
      {quotaExhausted ? (
        <p className="rounded-xl border border-amber-100 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
          {memberDiscoveryQuotaExhaustedNudge(quota.limit!)}{' '}
          <Link to={discoverProUpgradeHref} className="font-semibold underline">
            {MEMBER_DISCOVERY_QUOTA_UPGRADE_LINK}
          </Link>{' '}
          {MEMBER_DISCOVERY_QUOTA_UPGRADE_SUFFIX}
        </p>
      ) : null}
      {quotaLine ? (
        <p className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-900">
          {quotaLine}
        </p>
      ) : null}

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          On upcoming trips
        </h3>
        {onTrips.length === 0 ? (
          <p className="py-3 text-center text-sm text-neutral-500">{MEMBER_DISCOVERY_ON_TRIPS_EMPTY}</p>
        ) : (
          <ul className="space-y-2">
            {onTrips.map((row) => (
              <li
                key={`${row.userId}-${row.activityId}`}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200/75 bg-white p-3"
              >
                <Link to={memberDiscoverProfilePath(row.userId)} className="shrink-0">
                  <SecureAvatar
                    src={row.avatarUrl}
                    name={row.displayName}
                    className="h-11 w-11 ring-2 ring-white"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to={memberDiscoverProfilePath(row.userId)}
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
                {connectButton(row.userId, row.displayName)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Members
        </h3>
        {directory.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">{MEMBER_DISCOVERY_DIRECTORY_EMPTY}</p>
        ) : (
          <ul className="space-y-2">
            {directory.map((card) => (
              <li
                key={card.id}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200/75 bg-white p-3"
              >
                <Link to={memberDiscoverProfilePath(card.id)} className="shrink-0">
                  <SecureAvatar
                    src={card.avatarUrl}
                    name={card.displayName}
                    className="h-11 w-11 ring-2 ring-white"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to={memberDiscoverProfilePath(card.id)}
                    className="block truncate text-sm font-semibold text-neutral-900 hover:text-emerald-700 hover:underline"
                  >
                    {card.displayName}
                  </Link>
                  {card.city ? <p className="text-xs text-neutral-500">{card.city}</p> : null}
                </div>
                {connectButton(card.id, card.displayName)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
