import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  Baby,
  Mail,
  Copy,
  Plus,
  MessageSquare,
  UserPlus,
  Trash2,
  AlertTriangle,
  LogOut,
  Settings2,
  ChevronLeft,
} from 'lucide-react';
import {
  api,
  SocialGroupInviteView,
  SocialGroupMemberView,
  SocialGroupView,
} from '../api/index';
import {
  groupWallPostPolicyLabel,
  resolveGroupWallPostPolicy,
  type GroupWallPostPolicy,
} from '../utils/groupWallPostPolicy';
import {
  activityGroupChatPath,
  MESSAGES_CHAT_RETURN_TO_KEY,
} from '../utils/activityGroupChatNav';
import { MobileScreen } from '../components/layout/MobileScreen';
import { GlassCard } from '../components/mobile/GlassCard';
import { Dialog } from '../components/ui/Dialog';
import { AppSelect } from '../components/ui/AppSelect';
import { FormTabBar } from '../components/ui/FormTabBar';
import { SecureAvatar } from '../components/ui/SecureAvatar';
import { useAuth } from '../context/AuthContext';

type GroupType = 'family' | 'friends';
type GroupTab = 'members' | 'manage';

type GroupDetail = {
  group: SocialGroupView;
  membership: SocialGroupMemberView;
  members: SocialGroupMemberView[];
  invites: SocialGroupInviteView[];
};

const typeLabel: Record<string, string> = {
  family: 'Family',
  friends: 'Friends',
  activity: 'Activity chat',
};

const GROUP_TYPE_OPTIONS = [
  { value: 'family' as const, label: 'Family' },
  { value: 'friends' as const, label: 'Friends' },
];

const MEMBER_ROLE_OPTIONS = [
  { value: 'buddy' as const, label: 'Member' },
  { value: 'admin' as const, label: 'Admin' },
];

const emptyGroupForm = {
  type: 'family' as GroupType,
  name: '',
  slogan: '',
  bannerUrl: '',
  photoUrl: '',
};

export const Groups = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [groups, setGroups] = useState<SocialGroupView[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(searchParams.get('group'));
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [activeTab, setActiveTab] = useState<GroupTab>(() =>
    searchParams.get('tab') === 'manage' ? 'manage' : 'members'
  );

  const [showCreateModal, setShowCreateModal] = useState(
    () => searchParams.get('create') === '1' || searchParams.get('create') === 'true'
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [groupForm, setGroupForm] = useState(emptyGroupForm);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'buddy' as 'buddy' | 'admin' });
  const [kidName, setKidName] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [memberActionId, setMemberActionId] = useState<string | null>(null);
  const [acceptingInvite, setAcceptingInvite] = useState(false);

  const processedInviteRef = useRef<string | null>(null);
  const inviteToken = searchParams.get('invite');
  const fromCommunity = searchParams.get('from') === 'community';

  useEffect(() => {
    if (searchParams.get('create') !== '1' && searchParams.get('create') !== 'true') return;
    setShowCreateModal(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('create');
      return next;
    }, { replace: true });
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMeGroups();
      setGroups(res.data);
      setSelectedGroupId((current) => {
        const fromUrl = searchParams.get('group');
        if (fromUrl && res.data.some((g) => g.id === fromUrl)) return fromUrl;
        if (current && res.data.some((g) => g.id === current)) return current;
        return null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (groupId: string) => {
    try {
      const detailRes = await api.getMeGroupDetail(groupId);
      setDetail(detailRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load group details');
    }
  };

  const openGroupChat = (groupId: string) => {
    navigate(activityGroupChatPath(groupId), {
      state: { [MESSAGES_CHAT_RETURN_TO_KEY]: '/groups' },
    });
  };

  const openGroupManage = (groupId: string, tab: GroupTab = 'members') => {
    setSelectedGroupId(groupId);
    setActiveTab(tab);
    setSearchParams({ group: groupId, tab }, { replace: true });
  };

  const backToGroupList = () => {
    setSelectedGroupId(null);
    setDetail(null);
    setSearchParams({}, { replace: true });
  };

  useEffect(() => {
    void loadGroups();
  }, []);

  useEffect(() => {
    if (!selectedGroupId) {
      setDetail(null);
      return;
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('group', selectedGroupId);
      return next;
    }, { replace: true });
    void loadDetail(selectedGroupId);
  }, [selectedGroupId]);

  useEffect(() => {
    if (!inviteToken || processedInviteRef.current === inviteToken) return;
    processedInviteRef.current = inviteToken;
    setAcceptingInvite(true);
    setError(null);
    api
      .acceptMeGroupInvite(inviteToken)
      .then(() => {
        setSuccess('You joined the group!');
        const next = new URLSearchParams(searchParams);
        next.delete('invite');
        setSearchParams(next, { replace: true });
        return loadGroups();
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not accept invite');
      })
      .finally(() => setAcceptingInvite(false));
  }, [inviteToken]);

  const isAdmin = detail?.membership.role === 'admin';
  const isCreator = detail?.group.adminUserId === user?.id;
  const pendingInvites = detail?.invites.filter((invite) => invite.status === 'pending') ?? [];

  const adultMembers = useMemo(
    () => (detail?.members ?? []).filter((member) => member.memberType === 'adult'),
    [detail?.members]
  );
  const kidMembers = useMemo(
    () => (detail?.members ?? []).filter((member) => member.memberType === 'kid'),
    [detail?.members]
  );

  const toggleMemberAccess = async (memberId: string, nextActive: boolean) => {
    if (!detail?.group.id) return;
    setMemberActionId(memberId);
    setError(null);
    try {
      await api.updateMeGroupMemberStatus(detail.group.id, memberId, nextActive);
      await loadDetail(detail.group.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update member access');
    } finally {
      setMemberActionId(null);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!detail?.group.id) return;
    setMemberActionId(memberId);
    setError(null);
    try {
      await api.removeMeGroupMember(detail.group.id, memberId);
      await loadDetail(detail.group.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove member');
    } finally {
      setMemberActionId(null);
    }
  };

  const changeMemberRole = async (memberId: string, role: 'buddy' | 'admin') => {
    if (!detail?.group.id) return;
    setMemberActionId(memberId);
    setError(null);
    try {
      await api.updateMeGroupMemberRole(detail.group.id, memberId, role);
      await loadDetail(detail.group.id);
      setSuccess(role === 'admin' ? 'Member promoted to admin.' : 'Admin changed to member.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update member role');
    } finally {
      setMemberActionId(null);
    }
  };

  const memberRoleLabel = (member: SocialGroupMemberView) => {
    if (member.userId === detail?.group.adminUserId) return 'Owner';
    return member.role === 'admin' ? 'Admin' : 'Member';
  };

  const handleCreateGroup = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await api.createMeGroup({
        type: groupForm.type,
        name: groupForm.name,
        slogan: groupForm.slogan || undefined,
        bannerUrl: groupForm.bannerUrl || undefined,
        photoUrl: groupForm.photoUrl || undefined,
      });
      setGroupForm(emptyGroupForm);
      setShowCreateModal(false);
      await loadGroups();
      openGroupChat(res.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create group');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!detail?.group.id || !deleteConfirmed) return;
    setSaving(true);
    setError(null);
    try {
      await api.deleteMeGroup(detail.group.id);
      setShowDeleteModal(false);
      setDeleteConfirmed(false);
      setDetail(null);
      setSelectedGroupId(null);
      setSuccess('Group permanently deleted.');
      await loadGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete group');
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!detail?.group.id) return;
    setSaving(true);
    setError(null);
    try {
      await api.removeMeGroupMember(detail.group.id, detail.membership.id);
      setShowLeaveModal(false);
      setDetail(null);
      setSelectedGroupId(null);
      setSuccess(`You left ${detail.group.name}.`);
      await loadGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not leave group');
    } finally {
      setSaving(false);
    }
  };

  const renderGroupSummary = () => {
    if (!detail) return null;

    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 overflow-hidden">
            {detail.group.photoUrl ? (
              <img src={detail.group.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Users className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-neutral-900 truncate">{detail.group.name}</h2>
            <p className="text-sm text-neutral-600 mt-0.5">
              {typeLabel[detail.group.type]} · {detail.members.length} member{detail.members.length === 1 ? '' : 's'} ·{' '}
              {memberRoleLabel(detail.membership)}
            </p>
            {detail.group.slogan && (
              <p className="text-sm text-neutral-500 mt-1">{detail.group.slogan}</p>
            )}
            {pendingInvites.length > 0 && (
              <p className="text-xs text-amber-700 mt-1">
                {pendingInvites.length} pending invite{pendingInvites.length === 1 ? '' : 's'}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => openGroupChat(detail.group.id)}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <MessageSquare className="h-4 w-4" aria-hidden />
          Open group chat
        </button>
      </div>
    );
  };

  const renderMembersTab = () => {
    if (!detail) return null;

    return (
      <div className="space-y-3">
        <GlassCard padding>
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">Adults ({adultMembers.length})</h3>
          <div className="space-y-2">
            {adultMembers.map((member) => (
              <div key={member.id} className="rounded-xl border border-neutral-100 px-3 py-2.5 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <SecureAvatar
                    src={member.user?.avatarUrl}
                    name={member.user?.displayName || member.user?.email || 'Adult member'}
                    className="w-9 h-9 text-sm shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">
                      {member.user?.displayName || member.user?.email || 'Adult member'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {memberRoleLabel(member)}
                      {member.isActive === false ? ' · Disabled' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {isCreator &&
                    member.memberType === 'adult' &&
                    member.id !== detail.membership.id &&
                    member.userId !== detail.group.adminUserId && (
                      <AppSelect
                        value={member.role}
                        disabled={memberActionId === member.id}
                        onChange={(role) => void changeMemberRole(member.id, role)}
                        options={MEMBER_ROLE_OPTIONS}
                        size="compact"
                        aria-label={`Change role for ${member.user?.displayName || 'member'}`}
                      />
                    )}
                  {isAdmin && member.id !== detail.membership.id && (
                    <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => void toggleMemberAccess(member.id, !(member.isActive ?? true))}
                      disabled={memberActionId === member.id}
                      className="text-[11px] rounded-lg bg-amber-50 px-2 py-1 text-amber-800 disabled:opacity-50"
                    >
                      {member.isActive === false ? 'Enable' : 'Disable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeMember(member.id)}
                      disabled={memberActionId === member.id}
                      className="text-[11px] rounded-lg bg-rose-50 px-2 py-1 text-rose-800 disabled:opacity-50"
                    >
                      Remove
                    </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {kidMembers.length > 0 && (
          <GlassCard padding>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Kids ({kidMembers.length})</h3>
            <div className="space-y-2">
              {kidMembers.map((member) => (
                <div key={member.id} className="rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <Baby className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{member.displayName || 'Kid profile'}</p>
                    <p className="text-xs text-neutral-600 capitalize">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    );
  };

  const renderManageTab = () => {
    if (!detail || !isAdmin) return null;

    const wallPolicy = resolveGroupWallPostPolicy(detail.group);

    return (
      <div className="space-y-3">
        <GlassCard padding>
          <h3 className="text-sm font-semibold text-neutral-900 mb-2">Who can message</h3>
          <p className="text-xs text-neutral-500 mb-3">Applies to this group&apos;s chat for all members.</p>
          <div className="space-y-2">
            {(['all_members', 'admins_only'] as GroupWallPostPolicy[]).map((policy) => (
              <button
                key={policy}
                type="button"
                disabled={saving}
                onClick={async () => {
                  if (policy === wallPolicy) return;
                  setSaving(true);
                  setError(null);
                  try {
                    const res = await api.updateMeGroupSettings(detail.group.id, { wallPostPolicy: policy });
                    setDetail((current) =>
                      current ? { ...current, group: { ...current.group, ...res.data } } : current
                    );
                    setSuccess('Chat messaging settings updated.');
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Could not update chat settings');
                  } finally {
                    setSaving(false);
                  }
                }}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm ${
                  wallPolicy === policy
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                    : 'border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {groupWallPostPolicyLabel[policy]}
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard padding>
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-neutral-900">Invite members</h3>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-neutral-500">
            Send an email invite so they can join and chat in this group.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="member@email.com"
              className="ios-input min-w-0 flex-1 text-[14px]"
            />
            <AppSelect
              value={inviteForm.role}
              onChange={(role) => setInviteForm((prev) => ({ ...prev, role }))}
              options={MEMBER_ROLE_OPTIONS}
              className="sm:w-36"
              aria-label="Invite role"
            />
          </div>
          <button
            type="button"
            disabled={saving || !inviteForm.email.trim()}
            onClick={async () => {
              setSaving(true);
              setError(null);
              const invitedEmail = inviteForm.email.trim();
              try {
                const res = await api.createMeGroupInvite(detail.group.id, {
                  email: invitedEmail,
                  role: inviteForm.role,
                });
                setInviteLink(res.inviteLink);
                setInviteForm({ email: '', role: 'buddy' });
                setSuccess(`Invite sent to ${invitedEmail}.`);
                await loadDetail(detail.group.id);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not invite member');
              } finally {
                setSaving(false);
              }
            }}
            className="ios-btn bg-emerald-600 text-white mt-3 w-full sm:w-auto"
          >
            <Mail className="w-4 h-4" />
            Send invite
          </button>
          {inviteLink && (
            <div className="mt-3 rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2.5 text-xs text-neutral-700">
              <p className="font-semibold mb-1">Share invite link</p>
              <p className="break-all text-neutral-600">{inviteLink}</p>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-emerald-700 font-semibold mt-2"
                onClick={async () => {
                  await navigator.clipboard.writeText(inviteLink);
                  setSuccess('Invite link copied.');
                }}
              >
                <Copy className="w-3.5 h-3.5" />
                Copy link
              </button>
            </div>
          )}
        </GlassCard>

        {detail.group.type === 'family' && (
          <GlassCard padding>
            <h3 className="text-sm font-semibold text-neutral-900 mb-2">Add kid profile</h3>
            <div className="flex gap-2">
              <input
                value={kidName}
                onChange={(e) => setKidName(e.target.value)}
                placeholder="Kid display name"
                className="ios-input text-[14px] flex-1"
              />
              <button
                type="button"
                disabled={saving || !kidName.trim()}
                onClick={async () => {
                  setSaving(true);
                  setError(null);
                  try {
                    await api.createMeGroupKid(detail.group.id, { displayName: kidName });
                    setKidName('');
                    await loadDetail(detail.group.id);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Could not add kid profile');
                  } finally {
                    setSaving(false);
                  }
                }}
                className="ios-btn bg-emerald-600 text-white"
              >
                <Baby className="w-4 h-4" />
                Add
              </button>
            </div>
          </GlassCard>
        )}

        {pendingInvites.length > 0 && (
          <GlassCard padding>
            <h3 className="text-sm font-semibold text-neutral-900 mb-2">Pending invites</h3>
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="rounded-xl border border-neutral-100 px-3 py-2.5">
                  <p className="text-sm font-semibold text-neutral-900">{invite.email}</p>
                  <p className="text-xs text-neutral-600 capitalize">{invite.role} · {invite.status}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {isCreator && (
          <GlassCard padding className="border-red-100 bg-red-50/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-red-900">Delete group</h3>
                <p className="text-xs text-red-700/90 mt-1 leading-relaxed">
                  Permanently delete this group, all members, invites, and chat history. This cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmed(false);
                    setShowDeleteModal(true);
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete group
                </button>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    );
  };

  return (
    <MobileScreen title="My Groups" backTo={fromCommunity ? '/community' : '/profile'} showBanner={false}>
      <div className="space-y-4 pb-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-neutral-600">
            Create groups, invite members, and chat together.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            {success}
          </p>
        )}
        {acceptingInvite && (
          <p className="text-sm text-neutral-600 bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2">
            Accepting group invite…
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <GlassCard padding className="text-center py-14">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900">No groups yet</h3>
            <p className="text-sm text-neutral-500 mt-2 max-w-sm mx-auto">
              Create your first group and invite people you hike or camp with.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
              Create your first group
            </button>
          </GlassCard>
        ) : selectedGroupId && detail ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={backToGroupList}
              className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-600 hover:text-neutral-900"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              All groups
            </button>
            {renderGroupSummary()}
            <FormTabBar
              tabs={[
                { id: 'members', label: 'Members' },
                ...(isAdmin ? [{ id: 'manage', label: 'Manage' }] : []),
              ]}
              activeId={activeTab}
              onChange={(id) => {
                const tab = id as GroupTab;
                setActiveTab(tab);
                setSearchParams({ group: detail.group.id, tab }, { replace: true });
              }}
            />
            {activeTab === 'members' && renderMembersTab()}
            {activeTab === 'manage' && renderManageTab()}
            {!isCreator && detail.group.type !== 'activity' && (
              <GlassCard padding className="border-neutral-200">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                    <LogOut className="h-5 w-5 text-neutral-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-neutral-900">Leave group</h3>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                      You will lose access to this group&apos;s chat and member list. You can rejoin if an admin invites
                      you again.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowLeaveModal(true)}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Leave group
                    </button>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex items-stretch gap-1 rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => openGroupChat(group.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 overflow-hidden">
                    {group.photoUrl ? (
                      <img src={group.photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Users className="h-5 w-5" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">{group.name}</p>
                    <p className="text-xs text-neutral-500">{typeLabel[group.type]}</p>
                  </div>
                  <MessageSquare className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                </button>
                {group.type !== 'activity' ? (
                  <button
                    type="button"
                    onClick={() => openGroupManage(group.id)}
                    className="flex shrink-0 items-center justify-center border-l border-neutral-100 px-3 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
                    aria-label={`Manage ${group.name}`}
                  >
                    <Settings2 className="h-5 w-5" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreateModal} onClose={() => !saving && setShowCreateModal(false)} title="Create group">
        <p className="text-sm text-neutral-600 mb-4">
          Start a family or friends group. You can invite members and chat together after creating it.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1 block">Type</label>
            <AppSelect
              value={groupForm.type}
              onChange={(type) => setGroupForm((prev) => ({ ...prev, type }))}
              options={GROUP_TYPE_OPTIONS}
              aria-label="Group type"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1 block">Group name *</label>
            <input
              value={groupForm.name}
              onChange={(e) => setGroupForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Weekend hikers"
              className="ios-input w-full text-[14px]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1 block">Slogan</label>
            <input
              value={groupForm.slogan}
              onChange={(e) => setGroupForm((prev) => ({ ...prev, slogan: e.target.value }))}
              placeholder="Optional tagline"
              className="ios-input w-full text-[14px]"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={() => setShowCreateModal(false)}
            disabled={saving}
            className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !groupForm.name.trim()}
            onClick={() => void handleCreateGroup()}
            className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Creating…' : 'Create group'}
          </button>
        </div>
      </Dialog>

      <Dialog
        open={showLeaveModal}
        onClose={() => !saving && setShowLeaveModal(false)}
        title="Leave this group?"
      >
        <p className="text-sm text-neutral-600 leading-relaxed mb-5">
          You will no longer see <strong>{detail?.group.name}</strong> in your groups or its chat history.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowLeaveModal(false)}
            disabled={saving}
            className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-700"
          >
            Stay
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleLeaveGroup()}
            className="flex-1 rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Leaving…' : 'Leave group'}
          </button>
        </div>
      </Dialog>

      <Dialog
        open={showDeleteModal}
        onClose={() => !saving && setShowDeleteModal(false)}
        title="Delete group permanently?"
      >
        <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-3 mb-4">
          <p className="text-sm text-red-800 leading-relaxed">
            This will permanently delete <strong>{detail?.group.name}</strong>, remove all members and invites, and erase the group chat history. This action cannot be undone.
          </p>
        </div>
        <label className="flex items-start gap-3 cursor-pointer mb-5">
          <input
            type="checkbox"
            checked={deleteConfirmed}
            onChange={(e) => setDeleteConfirmed(e.target.checked)}
            className="mt-1 rounded border-neutral-300 text-red-600 focus:ring-red-500"
          />
          <span className="text-sm text-neutral-700">
            I understand this group will be permanently deleted and cannot be recovered.
          </span>
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowDeleteModal(false)}
            disabled={saving}
            className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !deleteConfirmed}
            onClick={() => void handleDeleteGroup()}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-red-700"
          >
            {saving ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </Dialog>
    </MobileScreen>
  );
};
