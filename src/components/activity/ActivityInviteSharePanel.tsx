import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { BuddySummaryDTO } from '@uaetrail/shared-types';
import { ShareButton } from '../ui/ShareButton';
import { SecureAvatar } from '../ui';
import { api } from '../../api/index';
import { GROUPS_PATH, PROFILE_PATH } from '../../config/routingCatalog';
import { useAuth } from '../../context/AuthContext';
import { buildActivitySharePayload, type ActivityShareInput } from '../../utils/activityShare';
import type { SocialGroupView } from '../../api/types';

type ActivityInviteSharePanelProps = {
  activity: ActivityShareInput;
  /** In-app buddy / group send requires sign-in. External share works for everyone. */
  compact?: boolean;
  className?: string;
};

const inviteableGroups = (groups: SocialGroupView[]) =>
  groups.filter((group) => group.type === 'family' || group.type === 'friends');

export const ActivityInviteSharePanel = ({
  activity,
  compact = false,
  className = '',
}: ActivityInviteSharePanelProps) => {
  const { user } = useAuth();
  const share = useMemo(() => buildActivitySharePayload(activity), [activity]);
  const [showInApp, setShowInApp] = useState(false);
  const [busyBuddyId, setBusyBuddyId] = useState<string | null>(null);
  const [busyGroupId, setBusyGroupId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: buddies = [], isLoading: buddiesLoading } = useQuery({
    queryKey: ['me-buddies', 'share'],
    queryFn: async () => {
      const res = await api.getMeBuddies();
      return res.data;
    },
    enabled: Boolean(user) && showInApp,
  });

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['me-groups', 'share'],
    queryFn: async () => {
      const res = await api.getMeGroups();
      return inviteableGroups(res.data);
    },
    enabled: Boolean(user) && showInApp,
  });

  const sendToBuddy = async (buddy: BuddySummaryDTO) => {
    setBusyBuddyId(buddy.userId);
    setError(null);
    setNotice(null);
    try {
      await api.sendMessage({
        receiverId: buddy.userId,
        content: share.messageWithUrl,
        activityId: activity.id,
      });
      setNotice(`Sent to ${buddy.displayName || 'your connection'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message.');
    } finally {
      setBusyBuddyId(null);
    }
  };

  const postToGroup = async (group: SocialGroupView) => {
    setBusyGroupId(group.id);
    setError(null);
    setNotice(null);
    try {
      await api.createMeGroupWallPost(group.id, share.messageWithUrl);
      setNotice(`Posted to ${group.name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post to group.');
    } finally {
      setBusyGroupId(null);
    }
  };

  return (
    <section
      className={`rounded-2xl border border-neutral-100 bg-white p-4 ${className}`}
      aria-labelledby="activity-invite-heading"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="activity-invite-heading" className="text-sm font-bold text-neutral-900">
            Invite your crew
          </h3>
          <p className="mt-1 text-xs text-neutral-600 leading-relaxed">
            Share a link on WhatsApp or anywhere. Friends can open the plan — sign up free to join or
            request a spot.
          </p>
        </div>
        <ShareButton title={share.title} text={share.text} path={share.path} iconOnly light />
      </div>

      {!compact ? (
        <div className="mt-3">
          <ShareButton title={share.title} text={share.text} path={share.path} className="w-full" />
        </div>
      ) : null}

      {user ? (
        <div className="mt-3 border-t border-neutral-100 pt-3">
          <button
            type="button"
            onClick={() => setShowInApp((open) => !open)}
            className="text-sm font-semibold text-emerald-700"
          >
            {showInApp ? 'Hide connections & groups' : 'Send via connections or groups'}
          </button>

          {showInApp ? (
            <div className="mt-3 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
                  Connections
                </p>
                {buddiesLoading ? (
                  <p className="text-xs text-neutral-500">Loading…</p>
                ) : buddies.length === 0 ? (
                  <p className="text-xs text-neutral-500">
                    No connections yet —{' '}
                    <Link to={PROFILE_PATH} className="font-semibold text-emerald-700">
                      find people on the map
                    </Link>
                    .
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {buddies.map((buddy) => (
                      <li key={buddy.userId}>
                        <button
                          type="button"
                          disabled={busyBuddyId === buddy.userId}
                          onClick={() => void sendToBuddy(buddy)}
                          className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-neutral-50 disabled:opacity-60"
                        >
                          <SecureAvatar
                            src={buddy.avatarUrl}
                            name={buddy.displayName || 'Member'}
                            className="h-9 w-9 text-xs"
                          />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900">
                            {buddy.displayName || 'Member'}
                          </span>
                          <span className="text-xs font-semibold text-emerald-700">Send</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
                  Groups
                </p>
                {groupsLoading ? (
                  <p className="text-xs text-neutral-500">Loading…</p>
                ) : groups.length === 0 ? (
                  <p className="text-xs text-neutral-500">
                    Create a family or friends group under{' '}
                    <Link to={GROUPS_PATH} className="font-semibold text-emerald-700">Groups</Link>.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {groups.map((group) => (
                      <li key={group.id}>
                        <button
                          type="button"
                          disabled={busyGroupId === group.id}
                          onClick={() => void postToGroup(group)}
                          className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-left hover:bg-neutral-50 disabled:opacity-60"
                        >
                          <span className="truncate text-sm font-medium text-neutral-900">{group.name}</span>
                          <span className="shrink-0 text-xs font-semibold text-emerald-700">Post link</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-xs text-neutral-500">
          <Link to={`/signup?redirect=${encodeURIComponent(share.path)}`} className="font-semibold text-emerald-700">
            Sign up free
          </Link>{' '}
          to message connections or post to your groups.
        </p>
      )}

      {notice ? <p className="mt-2 text-xs font-medium text-emerald-700">{notice}</p> : null}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </section>
  );
};
