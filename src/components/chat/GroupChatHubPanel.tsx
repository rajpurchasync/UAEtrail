import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Settings2, UserRound, Users } from 'lucide-react';
import type { SocialGroupMemberView, SocialGroupView } from '../../api/types';
import { fetchMeGroupDetail } from '../../hooks/groupClientApi';
import { groupsManagePath } from '../../config/routingCatalog';
import { groupWallPostPolicyLabel, resolveGroupWallPostPolicy } from '../../utils/groupWallPostPolicy';
import { isSocialGroupAdmin } from '../../utils/socialGroupAdmin';
import { useAuth } from '../../context/AuthContext';
import { ChatThreadHeaderBar } from './ChatThreadHeaderBar';
import { ChatLoadingState } from './ChatLoadingState';
import { MessageAvatar } from './ChatMessageAvatar';
import { GroupWallChatSettingsSheet } from './GroupWallChatSettingsSheet';
import { GroupWallMembersSheet } from './GroupWallMembersSheet';
import { SecureAvatar } from '../ui/SecureAvatar';

type GroupChatHubPanelProps = {
  groupId: string;
  fallbackName?: string;
  fallbackPhotoUrl?: string | null;
  onBack: () => void;
  onOpenChat: () => void;
  onGroupUpdated?: (group: SocialGroupView) => void;
};

export const GroupChatHubPanel = ({
  groupId,
  fallbackName,
  fallbackPhotoUrl,
  onBack,
  onOpenChat,
  onGroupUpdated,
}: GroupChatHubPanelProps) => {
  const { user } = useAuth();
  const [group, setGroup] = useState<SocialGroupView | null>(null);
  const [membership, setMembership] = useState<SocialGroupMemberView | null>(null);
  const [members, setMembers] = useState<SocialGroupMemberView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchMeGroupDetail(groupId);
      setGroup(detail.group);
      setMembership(detail.membership);
      setMembers(detail.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load group.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  const displayGroup = group;
  const title = displayGroup?.name || fallbackName || 'Group';
  const photoUrl = displayGroup?.photoUrl ?? fallbackPhotoUrl ?? undefined;
  const activeCount = members.filter((m) => m.memberType === 'adult' && m.isActive !== false).length;
  const postPolicy = displayGroup ? resolveGroupWallPostPolicy(displayGroup) : 'all_members';
  const admin = displayGroup ? isSocialGroupAdmin(displayGroup, membership, user?.id) : false;
  const slogan = displayGroup?.slogan?.trim();

  const handleGroupUpdated = (updated: SocialGroupView) => {
    setGroup(updated);
    onGroupUpdated?.(updated);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-white">
      <ChatThreadHeaderBar
        onBack={onBack}
        backLabel="Back to chat list"
        backVisibility="mobile-only"
        leading={
          photoUrl ? (
            <MessageAvatar name={title} url={photoUrl} />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Users className="h-5 w-5" aria-hidden />
            </div>
          )
        }
        title={title}
        subtitle={loading && !displayGroup ? 'Loading…' : 'Group · review before you chat'}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-8">
        {loading ? (
          <ChatLoadingState variant="thread" label="Loading group" />
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center">
              {photoUrl ? (
                <MessageAvatar name={title} url={photoUrl} size="lg" />
              ) : (
                <SecureAvatar name={title} className="h-16 w-16 text-lg bg-emerald-100 text-emerald-700" />
              )}
              <h1 className="mt-4 text-xl font-semibold text-neutral-900">{title}</h1>
              {slogan ? <p className="mt-2 max-w-sm text-sm italic text-neutral-600">&ldquo;{slogan}&rdquo;</p> : null}
              <p className="mt-3 text-sm text-neutral-500">
                {activeCount} participant{activeCount === 1 ? '' : 's'} · {groupWallPostPolicyLabel[postPolicy]}
              </p>
            </div>

            <div className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-2">
              <button
                type="button"
                onClick={onOpenChat}
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <MessageSquare className="h-4 w-4" aria-hidden />
                Open chat
              </button>
              <button
                type="button"
                onClick={() => setMembersOpen(true)}
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
              >
                <Users className="h-4 w-4" aria-hidden />
                View participants
              </button>
              {admin && displayGroup ? (
                <>
                  <Link
                    to={groupsManagePath(displayGroup.id, 'settings')}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                  >
                    <UserRound className="h-4 w-4" aria-hidden />
                    Edit group
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(true)}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                  >
                    <Settings2 className="h-4 w-4" aria-hidden />
                    Chat settings
                  </button>
                </>
              ) : null}
            </div>
          </>
        )}
      </div>

      {displayGroup ? (
        <>
          <GroupWallMembersSheet
            open={membersOpen}
            onClose={() => setMembersOpen(false)}
            group={displayGroup}
            members={members}
          />
          <GroupWallChatSettingsSheet
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            group={displayGroup}
            onUpdated={handleGroupUpdated}
            onError={setError}
          />
        </>
      ) : null}
    </div>
  );
};
