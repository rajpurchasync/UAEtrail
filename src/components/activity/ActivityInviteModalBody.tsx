import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, CheckCircle2, Loader2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SecureAvatar } from '../ui';
import { FormTabBar } from '../ui/FormTabBar';
import { TabPageSearchRow } from '../mobile/TabPageSearchRow';
import {
  activityInviteBuddiesQueryKey,
  activityJoinInvitesSentQueryKey,
  meGroupsActivityInviteQueryKey,
} from '../../hooks/clientQueryKeys';
import {
  fetchActivityJoinInvitesSentInviteeIds,
  fetchMeBuddies,
  fetchMeGroups,
  sendActivityJoinInvitesToBuddies,
} from '../../hooks/activityInviteClientApi';
import { messagingApi } from '../../messaging';
import { BUDDIES_PATH, GROUPS_PATH } from '../../config/routingCatalog';
import { useAuth } from '../../context/AuthContext';
import {
  ACTIVITY_INVITE_CLEAR_SELECTION,
  ACTIVITY_INVITE_GROUPS_NO_SEARCH_RESULTS,
  ACTIVITY_INVITE_GROUPS_POSTED_TOAST,
  ACTIVITY_INVITE_GROUPS_SEARCH_PLACEHOLDER,
  ACTIVITY_INVITE_GROUPS_SEND_LABEL,
  ACTIVITY_INVITE_NO_FRIENDS,
  ACTIVITY_INVITE_NO_GROUPS,
  ACTIVITY_INVITE_NO_SEARCH_RESULTS,
  ACTIVITY_INVITE_SEARCH_PLACEHOLDER,
  ACTIVITY_INVITE_SELECT_ALL,
  ACTIVITY_INVITE_SEND_LABEL,
  ACTIVITY_INVITE_SENT_SUCCESS_HEADLINE,
  ACTIVITY_INVITE_GROUPS_SENT_SUCCESS_HEADLINE,
  ACTIVITY_INVITE_TAB_FRIENDS,
  ACTIVITY_INVITE_TAB_GROUPS,
  activityInviteSentSuccessLine,
} from '../../content/activityInviteCopy';
import { EXPLORE_BUDDY_JOIN_ME_INVITE_SENT_LABEL } from '../../content/exploreGoingPanelCopy';
import { userCreatedSocialGroups } from '../../utils/userCreatedSocialGroups';

type InviteTab = 'friends' | 'groups';

type ActivityInviteModalBodyProps = {
  activityId: string;
  messageWithUrl: string;
  initialSelectedBuddyIds?: string[];
  /** When modal opens */
  active: boolean;
  /** After a successful send — sheet closes when animation finishes. */
  onInviteSent?: () => void;
};

const INVITE_SENT_AUTO_CLOSE_MS = 1400;

const ActivityInviteSentSuccess = ({
  headline,
  detail,
}: {
  headline: string;
  detail: string;
}) => (
  <div
    className="flex min-h-[220px] flex-col items-center justify-center px-2 py-8 text-center"
    role="status"
    aria-live="polite"
  >
    <div className="relative">
      <span
        className="absolute inset-0 rounded-full bg-emerald-400/25 motion-safe:animate-ping"
        aria-hidden
      />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 motion-safe:animate-[bounce_0.55s_ease-out_1]">
        <CheckCircle2 className="h-9 w-9" strokeWidth={2.25} aria-hidden />
      </div>
    </div>
    <p className="mt-5 text-base font-bold text-neutral-900">{headline}</p>
    <p className="mt-1.5 max-w-[16rem] text-sm leading-snug text-neutral-600">{detail}</p>
  </div>
);

const buddyDisplayName = (displayName: string | null | undefined) =>
  (displayName?.trim() || 'Member').toLowerCase();

export const ActivityInviteModalBody = ({
  activityId,
  messageWithUrl,
  initialSelectedBuddyIds,
  active,
  onInviteSent,
}: ActivityInviteModalBodyProps) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<InviteTab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuddyIds, setSelectedBuddyIds] = useState<Set<string>>(() => {
    const seed = initialSelectedBuddyIds?.filter((id) => id.trim()) ?? [];
    return seed.length > 0 ? new Set(seed) : new Set();
  });
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState<{
    headline: string;
    detail: string;
  } | null>(null);

  useEffect(() => {
    if (!active) {
      setSearchQuery('');
      setError(null);
      setSentSuccess(null);
    }
  }, [active]);

  useEffect(() => {
    if (!sentSuccess || !onInviteSent) return;
    const timer = window.setTimeout(() => onInviteSent(), INVITE_SENT_AUTO_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [sentSuccess, onInviteSent]);

  const { data: buddies = [], isLoading: buddiesLoading } = useQuery({
    queryKey: activityInviteBuddiesQueryKey(activityId),
    queryFn: fetchMeBuddies,
    enabled: Boolean(user) && active,
  });

  const { data: sentInviteeIds = [], refetch: refetchSentInvites } = useQuery({
    queryKey: activityJoinInvitesSentQueryKey(activityId),
    queryFn: () => fetchActivityJoinInvitesSentInviteeIds(activityId),
    enabled: Boolean(user) && active,
  });

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: meGroupsActivityInviteQueryKey,
    queryFn: async () => userCreatedSocialGroups(await fetchMeGroups()),
    enabled: Boolean(user) && active,
  });

  const sentInviteeSet = useMemo(() => new Set(sentInviteeIds), [sentInviteeIds]);
  const searchTrimmed = searchQuery.trim().toLowerCase();

  const filteredBuddies = useMemo(() => {
    if (!searchTrimmed || tab !== 'friends') return buddies;
    return buddies.filter((buddy) => buddyDisplayName(buddy.displayName).includes(searchTrimmed));
  }, [buddies, searchTrimmed, tab]);

  const filteredGroups = useMemo(() => {
    if (!searchTrimmed || tab !== 'groups') return groups;
    return groups.filter((group) => group.name.trim().toLowerCase().includes(searchTrimmed));
  }, [groups, searchTrimmed, tab]);

  const filteredSelectableBuddyIds = useMemo(
    () =>
      filteredBuddies
        .filter((buddy) => !sentInviteeSet.has(buddy.userId))
        .map((b) => b.userId),
    [filteredBuddies, sentInviteeSet]
  );

  const filteredGroupIds = useMemo(() => filteredGroups.map((g) => g.id), [filteredGroups]);

  const allFriendsSelected =
    filteredSelectableBuddyIds.length > 0 &&
    filteredSelectableBuddyIds.every((id) => selectedBuddyIds.has(id));

  const allGroupsSelected =
    filteredGroupIds.length > 0 && filteredGroupIds.every((id) => selectedGroupIds.has(id));

  const searchPlaceholder =
    tab === 'friends' ? ACTIVITY_INVITE_SEARCH_PLACEHOLDER : ACTIVITY_INVITE_GROUPS_SEARCH_PLACEHOLDER;

  const toggleSelectAll = () => {
    if (tab === 'friends') {
      if (allFriendsSelected) {
        setSelectedBuddyIds((prev) => {
          const next = new Set(prev);
          for (const id of filteredSelectableBuddyIds) next.delete(id);
          return next;
        });
        return;
      }
      setSelectedBuddyIds((prev) => {
        const next = new Set(prev);
        for (const id of filteredSelectableBuddyIds) next.add(id);
        return next;
      });
      return;
    }
    if (allGroupsSelected) {
      setSelectedGroupIds((prev) => {
        const next = new Set(prev);
        for (const id of filteredGroupIds) next.delete(id);
        return next;
      });
      return;
    }
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      for (const id of filteredGroupIds) next.add(id);
      return next;
    });
  };

  const selectedCount = tab === 'friends' ? selectedBuddyIds.size : selectedGroupIds.size;

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      if (tab === 'friends') {
        const ids = [...selectedBuddyIds];
        if (ids.length === 0) return;
        const sent = await sendActivityJoinInvitesToBuddies(activityId, ids);
        await refetchSentInvites();
        setSelectedBuddyIds(new Set());
        setSentSuccess({
          headline: ACTIVITY_INVITE_SENT_SUCCESS_HEADLINE,
          detail: activityInviteSentSuccessLine(sent),
        });
        return;
      }
      const ids = [...selectedGroupIds];
      if (ids.length === 0) return;
      for (const groupId of ids) {
        await messagingApi.crew.post(groupId, messageWithUrl);
      }
      setSelectedGroupIds(new Set());
      setSentSuccess({
        headline: ACTIVITY_INVITE_GROUPS_SENT_SUCCESS_HEADLINE,
        detail: ACTIVITY_INVITE_GROUPS_POSTED_TOAST(ids.length),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send.');
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <p className="text-sm text-neutral-600">
        <Link to="/signup" className="font-semibold text-emerald-700 hover:underline">Sign up</Link> to invite
        friends or groups.
      </p>
    );
  }

  const listLoading = tab === 'friends' ? buddiesLoading : groupsLoading;

  if (sentSuccess) {
    return (
      <ActivityInviteSentSuccess headline={sentSuccess.headline} detail={sentSuccess.detail} />
    );
  }

  return (
    <div className="flex min-h-0 flex-col">
      <FormTabBar
        tabs={[
          { id: 'friends', label: ACTIVITY_INVITE_TAB_FRIENDS },
          { id: 'groups', label: ACTIVITY_INVITE_TAB_GROUPS },
        ]}
        activeId={tab}
        onChange={(id) => {
          setTab(id as InviteTab);
          setSearchQuery('');
          setError(null);
          setSentSuccess(null);
        }}
      />

      <div className="mt-3 min-h-0 flex-1 space-y-3">
        <TabPageSearchRow
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={searchPlaceholder}
          inset
          className="!pt-0"
        />

        {listLoading ? (
          <p className="flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading…
          </p>
        ) : tab === 'friends' && buddies.length === 0 ? (
          <p className="text-sm text-neutral-600">
            {ACTIVITY_INVITE_NO_FRIENDS}{' '}
            <Link to={BUDDIES_PATH} className="font-semibold text-emerald-700 hover:underline">Friends</Link>
          </p>
        ) : tab === 'groups' && groups.length === 0 ? (
          <p className="text-sm text-neutral-600">
            {ACTIVITY_INVITE_NO_GROUPS}{' '}
            <Link to={GROUPS_PATH} className="font-semibold text-emerald-700 hover:underline">Groups</Link>
          </p>
        ) : (
          <>
            {(tab === 'friends' ? filteredSelectableBuddyIds.length : filteredGroupIds.length) > 0 ? (
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  {(tab === 'friends' ? allFriendsSelected : allGroupsSelected)
                    ? ACTIVITY_INVITE_CLEAR_SELECTION
                    : ACTIVITY_INVITE_SELECT_ALL}
                </button>
                <span className="text-xs text-neutral-500">{selectedCount} selected</span>
              </div>
            ) : null}

            {tab === 'friends' && filteredBuddies.length === 0 ? (
              <p className="text-sm text-neutral-500">{ACTIVITY_INVITE_NO_SEARCH_RESULTS}</p>
            ) : null}
            {tab === 'groups' && filteredGroups.length === 0 ? (
              <p className="text-sm text-neutral-500">{ACTIVITY_INVITE_GROUPS_NO_SEARCH_RESULTS}</p>
            ) : null}

            <ul className="max-h-[min(50vh,20rem)] space-y-1 overflow-y-auto overscroll-contain">
              {tab === 'friends'
                ? filteredBuddies.map((buddy) => {
                    const alreadyInvited = sentInviteeSet.has(buddy.userId);
                    const selected = selectedBuddyIds.has(buddy.userId);
                    const selectable = !alreadyInvited;
                    return (
                      <li key={buddy.userId}>
                        <button
                          type="button"
                          disabled={!selectable || busy}
                          onClick={() => {
                            if (!selectable) return;
                            setSelectedBuddyIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(buddy.userId)) next.delete(buddy.userId);
                              else next.add(buddy.userId);
                              return next;
                            });
                          }}
                          aria-pressed={selectable ? selected : undefined}
                          className={`flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left ${
                            !selectable
                              ? 'cursor-default opacity-60'
                              : selected
                                ? 'bg-emerald-50 ring-1 ring-emerald-200'
                                : 'hover:bg-neutral-50 active:bg-neutral-100'
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                              selected && !alreadyInvited
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-neutral-300 bg-white'
                            }`}
                            aria-hidden
                          >
                            {selected && !alreadyInvited ? (
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            ) : null}
                          </span>
                          <SecureAvatar
                            src={buddy.avatarUrl}
                            name={buddy.displayName || 'Member'}
                            className="h-10 w-10 text-xs"
                          />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">
                            {buddy.displayName || 'Member'}
                          </span>
                          {alreadyInvited ? (
                            <span className="shrink-0 text-xs font-semibold text-neutral-500">
                              {EXPLORE_BUDDY_JOIN_ME_INVITE_SENT_LABEL}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })
                : filteredGroups.map((group) => {
                    const selected = selectedGroupIds.has(group.id);
                    return (
                      <li key={group.id}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            setSelectedGroupIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(group.id)) next.delete(group.id);
                              else next.add(group.id);
                              return next;
                            })
                          }
                          aria-pressed={selected}
                          className={`flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left ${
                            selected
                              ? 'bg-sky-50 ring-1 ring-sky-200'
                              : 'hover:bg-neutral-50 active:bg-neutral-100'
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                              selected ? 'border-sky-600 bg-sky-600 text-white' : 'border-neutral-300 bg-white'
                            }`}
                            aria-hidden
                          >
                            {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                          </span>
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-100 text-sky-700"
                            aria-hidden
                          >
                            {group.photoUrl ? (
                              <img src={group.photoUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Users className="h-5 w-5" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">
                            {group.name}
                          </span>
                        </button>
                      </li>
                    );
                  })}
            </ul>
          </>
        )}

        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>

      <button
        type="button"
        disabled={busy || selectedCount === 0}
        onClick={() => void send()}
        className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy
          ? 'Sending…'
          : tab === 'friends'
            ? ACTIVITY_INVITE_SEND_LABEL(selectedCount)
            : ACTIVITY_INVITE_GROUPS_SEND_LABEL(selectedCount)}
      </button>
    </div>
  );
};
