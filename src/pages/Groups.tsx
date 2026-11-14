import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SOCIAL_GROUP_NAME_MAX_LENGTH } from '@uaetrail/shared-types';
import {
  Users,
  Baby,
  Plus,
  MessageSquare,
  UserPlus,
  LogOut,
  Settings2,
} from 'lucide-react';
import type { SocialGroupInviteView, SocialGroupMemberView, SocialGroupView } from '../api/types';
import {
  acceptMeGroupInviteToken,
  createMeGroupInviteLink,
  createMeGroupKidMember,
  createMeGroup,
  deleteMeGroup,
  fetchMeGroupDetail,
  fetchMeGroups,
  removeMeGroupMember,
  updateMeGroupKidMember,
  updateMeGroupMemberActive,
  updateMeGroupMemberRole,
} from '../hooks/groupClientApi';
import { crewsHomePath } from '../config/mobileFiveTabNav';
import {
  BUDDIES_PATH,
  CREWS_ORIGIN_QUERY,
  GROUPS_PATH,
  groupsManagePath,
  isCrewsOriginQuery,
  normalizeGroupManageSection,
  type GroupManagePathArg,
  type GroupManageSection,
  type GroupMembersFocus,
} from '../config/surfacePaths';
import {
  PRODUCT_CREWS_TAB_LABEL,
  PRODUCT_GROUPS_SURFACE_LABEL,
  PRODUCT_MY_CREW_SURFACE_TITLE,
  PRODUCT_TEAM_CHAT_SUBTITLE,
} from '../content/productNorthStar';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { navigateToGroupChatFromSocial } from '../utils/activityGroupChatNav';
import { GlassCard } from '../components/mobile/GlassCard';
import { Dialog } from '../components/ui/Dialog';
import { AppSelect } from '../components/ui/AppSelect';
import { SecureAvatar } from '../components/ui/SecureAvatar';
import { SettingsMenuGroup, SettingsMenuRow } from '../components/settings/SettingsMenuRow';
import { updateMyGroupSettings } from '../hooks/socialGroupSettingsApi';
import { GroupEditPanel } from '../groups/GroupEditPanel';
import { GroupMembersPanel } from '../groups/GroupMembersPanel';
import {
  emptyKidForm,
  isKidTripFormReady,
  kidFullProfilePayload,
  resolveKidEmergencyFromForm,
} from '../groups/groupKidForm';
import { useAuth } from '../context/AuthContext';
import { useMeProfile } from '../hooks/useMeProfile';
import type { MobileBackChrome } from '../utils/mobileBackNav';

type GroupType = 'family' | 'friends';

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

const emptyGroupForm = {
  type: 'family' as GroupType,
  name: '',
  bannerUrl: '',
  photoUrl: '',
};

const MANAGE_SECTION_TITLES: Record<Exclude<GroupManageSection, 'hub'>, string> = {
  members: 'Members',
  edit: 'Edit group',
};

export const Groups = () => {
  const { user } = useAuth();
  const { profile: meProfile } = useMeProfile(Boolean(user));
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [groups, setGroups] = useState<SocialGroupView[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(searchParams.get('group'));
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [activeSection, setActiveSection] = useState<GroupManageSection>(() =>
    normalizeGroupManageSection(searchParams.get('section'), searchParams.get('tab'))
  );
  const [showKidTripForm, setShowKidTripForm] = useState(false);
  const crewsOrigin = isCrewsOriginQuery(searchParams.get('from'));

  const [showCreateModal, setShowCreateModal] = useState(
    () => searchParams.get('create') === '1' || searchParams.get('create') === 'true'
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [groupForm, setGroupForm] = useState(emptyGroupForm);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'buddy' as 'buddy' | 'admin' });
  const [kidForm, setKidForm] = useState(emptyKidForm);
  const [editingKidId, setEditingKidId] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [memberActionId, setMemberActionId] = useState<string | null>(null);
  const [acceptingInvite, setAcceptingInvite] = useState(false);
  /** After create — soft setup card on the group hub (dismissible). */
  const [setupPromptGroupId, setSetupPromptGroupId] = useState<string | null>(null);

  const meEmergency = useMemo(() => {
    const name =
      meProfile?.displayName?.trim() ||
      user?.displayName?.trim() ||
      user?.email?.split('@')[0] ||
      '';
    const phone = (meProfile?.phone ?? '').trim();
    return { name, phone };
  }, [meProfile?.displayName, meProfile?.phone, user?.displayName, user?.email]);

  const resolvedKidEmergency = useMemo(
    () => resolveKidEmergencyFromForm(kidForm, meEmergency),
    [kidForm, meEmergency]
  );

  const kidTripFormReady = isKidTripFormReady(kidForm, resolvedKidEmergency);

  const showingGroupDetail = Boolean(selectedGroupId);

  const shellTitle = useMemo(() => {
    if (!showingGroupDetail) return PRODUCT_GROUPS_SURFACE_LABEL;
    if (activeSection === 'hub') return detail?.group.name ?? 'Group';
    return MANAGE_SECTION_TITLES[activeSection];
  }, [activeSection, detail?.group.name, showingGroupDetail]);

  const teamsListPath = crewsOrigin
    ? `${GROUPS_PATH}?${new URLSearchParams({ from: CREWS_ORIGIN_QUERY })}`
    : GROUPS_PATH;

  const backChrome = useMemo((): MobileBackChrome => {
    if (!showingGroupDetail) {
      return {
        fallbackTo: crewsOrigin ? crewsHomePath() : BUDDIES_PATH,
        label: crewsOrigin ? PRODUCT_CREWS_TAB_LABEL : PRODUCT_MY_CREW_SURFACE_TITLE,
        backBehavior: 'fallback',
      };
    }
    if (activeSection === 'hub') {
      return {
        fallbackTo: teamsListPath,
        label: PRODUCT_GROUPS_SURFACE_LABEL,
        backBehavior: 'fallback',
      };
    }
    const manageFrom = crewsOrigin ? { from: CREWS_ORIGIN_QUERY } : undefined;
    return {
      fallbackTo: groupsManagePath(selectedGroupId as string, 'hub', manageFrom),
      label: detail?.group.name ?? 'Team',
      backBehavior: 'fallback',
    };
  }, [
    activeSection,
    crewsOrigin,
    detail?.group.name,
    selectedGroupId,
    showingGroupDetail,
    teamsListPath,
  ]);

  const processedInviteRef = useRef<string | null>(null);
  const inviteToken = searchParams.get('invite');

  useEffect(() => {
    const groupId = searchParams.get('group');
    if (!groupId) return;
    const section = searchParams.get('section');
    const tab = searchParams.get('tab');
    if (section === 'invite' || section === 'kids' || section === 'settings') {
      const focus: GroupMembersFocus | undefined =
        section === 'invite' ? 'invite' : section === 'kids' ? 'add-kid' : undefined;
      navigate(
        groupsManagePath(
          groupId,
          section === 'settings' ? 'edit' : 'members',
          focus ? { focus } : undefined
        ),
        { replace: true }
      );
      return;
    }
    if (!section && tab) {
      if (tab === 'members') {
        navigate(groupsManagePath(groupId, 'members'), { replace: true });
        return;
      }
      if (tab === 'manage') {
        navigate(groupsManagePath(groupId, 'edit'), { replace: true });
      }
    }
  }, [navigate, searchParams]);

  useEffect(() => {
    if (searchParams.get('create') !== '1' && searchParams.get('create') !== 'true') return;
    setShowCreateModal(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('create');
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- consume create query param once on mount
  }, []);

  const loadGroups = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const list = await fetchMeGroups();
      setGroups(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  const loadDetail = async (groupId: string) => {
    try {
      const detailPayload = await fetchMeGroupDetail(groupId);
      setDetail(detailPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load group details');
    }
  };

  const focusGroupChat = useCallback(
    (groupId: string, manageSection: GroupManageSection = 'hub') => {
      navigateToGroupChatFromSocial(navigate, groupId, manageSection);
    },
    [navigate]
  );

  const openGroupManage = (
    groupId: string,
    section: GroupManagePathArg = 'hub',
    options?: { focus?: GroupMembersFocus }
  ) => {
    const normalized = normalizeGroupManageSection(section, null);
    setSelectedGroupId(groupId);
    setActiveSection(normalized);
    setSearchParams(
      () => {
        const next = new URLSearchParams();
        next.set('group', groupId);
        if (normalized !== 'hub') next.set('section', normalized);
        const focus =
          options?.focus ??
          (section === 'invite' ? 'invite' : section === 'kids' ? 'add-kid' : undefined);
        if (focus && normalized === 'members') next.set('focus', focus);
        else next.delete('focus');
        if (crewsOrigin) next.set('from', CREWS_ORIGIN_QUERY);
        return next;
      },
      { replace: true }
    );
  };

  const membersFocus = searchParams.get('focus');
  const focusInvite = membersFocus === 'invite';
  const focusAddKid = membersFocus === 'add-kid';

  const handleGroupMetaUpdated = useCallback((group: SocialGroupView) => {
    setGroups((prev) => prev.map((row) => (row.id === group.id ? group : row)));
    setDetail((current) =>
      current?.group.id === group.id
        ? { ...current, group }
        : current
    );
  }, []);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const socialGroups = useMemo(
    () => groups.filter((group) => group.type === 'family' || group.type === 'friends'),
    [groups]
  );
  const outingGroups = useMemo(
    () => groups.filter((group) => group.type === 'activity'),
    [groups]
  );

  useEffect(() => {
    setSelectedGroupId(searchParams.get('group'));
  }, [searchParams]);

  useEffect(() => {
    if (!selectedGroupId) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedGroupId);
  }, [selectedGroupId]);

  useEffect(() => {
    setActiveSection(
      normalizeGroupManageSection(searchParams.get('section'), searchParams.get('tab'))
    );
    const focus = searchParams.get('focus');
    if (focus === 'add-kid') setShowKidForm(true);
  }, [searchParams]);

  useEffect(() => {
    if (!inviteToken || processedInviteRef.current === inviteToken) return;
    processedInviteRef.current = inviteToken;
    setAcceptingInvite(true);
    setError(null);
    acceptMeGroupInviteToken(inviteToken)
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
  }, [inviteToken, loadGroups, searchParams, setSearchParams]);

  const isAdmin = detail?.membership.role === 'admin';
  const isCreator = detail?.group.adminUserId === user?.id;
  const toggleMemberAccess = async (memberId: string, nextActive: boolean) => {
    if (!detail?.group.id) return;
    setMemberActionId(memberId);
    setError(null);
    try {
      await updateMeGroupMemberActive(detail.group.id, memberId, nextActive);
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
      await removeMeGroupMember(detail.group.id, memberId);
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
      await updateMeGroupMemberRole(detail.group.id, memberId, role);
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
      const created = await createMeGroup({
        type: groupForm.type,
        name: groupForm.name.trim(),
        bannerUrl: groupForm.bannerUrl || undefined,
        photoUrl: groupForm.photoUrl || undefined,
      });
      const createdType = groupForm.type;
      setGroupForm(emptyGroupForm);
      setShowCreateModal(false);
      await loadGroups();
      setSetupPromptGroupId(created.id);
      openGroupManage(created.id, 'hub');
      setSuccess(
        createdType === 'family'
          ? 'Family group created. Invite people or add kids whenever you like.'
          : 'Group created. Invite people when you are ready — or skip for now.'
      );
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
      await deleteMeGroup(detail.group.id);
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
      await removeMeGroupMember(detail.group.id, detail.membership.id);
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

  const handleGroupPhotoUpdated = useCallback((group: SocialGroupView) => {
    handleGroupMetaUpdated(group);
  }, [handleGroupMetaUpdated]);

  const saveGroupPhoto = async (groupId: string, photoUrl: string) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateMyGroupSettings(groupId, {
        photoUrl: photoUrl.trim() ? photoUrl.trim() : null,
      });
      handleGroupPhotoUpdated(updated);
      setSuccess('Group image updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update group image.');
    } finally {
      setSaving(false);
    }
  };

  const renderGroupSummary = () => {
    if (!detail) return null;

    return (
      <div className="flex items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 shadow-sm">
        <SecureAvatar
          src={detail.group.photoUrl ?? undefined}
          name={detail.group.name}
          className="h-12 w-12 text-base"
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-semibold text-neutral-900">{detail.group.name}</h2>
          <p className="truncate text-xs text-neutral-500">
            {typeLabel[detail.group.type]} · {detail.members.length} member
            {detail.members.length === 1 ? '' : 's'} · {memberRoleLabel(detail.membership)}
          </p>
        </div>
      </div>
    );
  };

  const sendMemberInvite = async () => {
    if (!detail?.group.id) return;
    setSaving(true);
    setError(null);
    const invitedEmail = inviteForm.email.trim();
    try {
      const { inviteLink: link } = await createMeGroupInviteLink(detail.group.id, {
        email: invitedEmail,
        role: inviteForm.role,
      });
      setInviteLink(link);
      setInviteForm({ email: '', role: 'buddy' });
      setSuccess(`Invite sent to ${invitedEmail}. Share the link if they need it.`);
      await loadDetail(detail.group.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not invite member');
    } finally {
      setSaving(false);
    }
  };

  const saveGroupName = async (name: string) => {
    if (!detail?.group.id) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateMyGroupSettings(detail.group.id, { name });
      handleGroupMetaUpdated(updated);
      setSuccess('Group name updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update group name.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddKidRoster = async (displayName: string) => {
    if (!detail?.group.id) return;
    setSaving(true);
    setError(null);
    try {
      await createMeGroupKidMember(detail.group.id, { rosterOnly: true, displayName });
      setSuccess(`${displayName} added to your team roster.`);
      await loadDetail(detail.group.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add kid to roster');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveKidTripDetails = async () => {
    if (!detail?.group.id) return;
    setSaving(true);
    setError(null);
    const payload = kidFullProfilePayload(kidForm, resolvedKidEmergency);
    try {
      if (editingKidId) {
        await updateMeGroupKidMember(detail.group.id, editingKidId, payload);
        setSuccess('Trip details saved.');
      } else {
        await createMeGroupKidMember(detail.group.id, payload);
        setSuccess('Kid added with trip details.');
      }
      setKidForm(emptyKidForm);
      setEditingKidId(null);
      setShowKidTripForm(false);
      await loadDetail(detail.group.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save trip details');
    } finally {
      setSaving(false);
    }
  };

  const renderMembersSection = () => {
    if (!detail) return null;
    return (
      <GroupMembersPanel
        group={detail.group}
        members={detail.members}
        membership={detail.membership}
        invites={detail.invites}
        isAdmin={isAdmin}
        isCreator={isCreator}
        adminUserId={detail.group.adminUserId}
        saving={saving}
        memberActionId={memberActionId}
        inviteEmail={inviteForm.email}
        inviteRole={inviteForm.role}
        inviteLink={inviteLink}
        onInviteEmailChange={(value) => setInviteForm((prev) => ({ ...prev, email: value }))}
        onInviteRoleChange={(role) => setInviteForm((prev) => ({ ...prev, role }))}
        onSendInvite={() => void sendMemberInvite()}
        onCopyInviteLink={() => {
          if (!inviteLink) return;
          void navigator.clipboard.writeText(inviteLink).then(() => setSuccess('Invite link copied.'));
        }}
        kidForm={kidForm}
        onKidFormChange={(updater) => setKidForm(updater)}
        editingKidId={editingKidId}
        onEditingKidIdChange={setEditingKidId}
        onResetKidForm={() => setKidForm(emptyKidForm)}
        kidTripFormReady={kidTripFormReady}
        onSaveKidTripDetails={() => void handleSaveKidTripDetails()}
        onAddKidRoster={(name) => void handleAddKidRoster(name)}
        meEmergency={meEmergency}
        memberRoleLabel={memberRoleLabel}
        onChangeMemberRole={(id, role) => void changeMemberRole(id, role)}
        onToggleMemberAccess={(id, active) => void toggleMemberAccess(id, active)}
        onRemoveMember={(id) => void removeMember(id)}
        focusInvite={focusInvite}
        focusAddKid={focusAddKid}
        showKidTripForm={showKidTripForm}
        onShowKidTripFormChange={setShowKidTripForm}
      />
    );
  };

  const renderEditSection = () => {
    if (!detail) return null;
    return (
      <GroupEditPanel
        group={detail.group}
        isAdmin={isAdmin}
        isCreator={isCreator}
        saving={saving}
        onSaveName={saveGroupName}
        onSavePhoto={(url) => saveGroupPhoto(detail.group.id, url)}
        onDeleteClick={() => {
          setDeleteConfirmed(false);
          setShowDeleteModal(true);
        }}
      />
    );
  };

  const renderGroupHub = () => {
    if (!detail) return null;

    const isFamily = detail.group.type === 'family';
    const isActivity = detail.group.type === 'activity';
    const showSetupPrompt = isAdmin && setupPromptGroupId === detail.group.id && !isActivity;

    return (
      <div className="space-y-3">
        {renderGroupSummary()}
        {showSetupPrompt ? (
          <GlassCard padding className="border-emerald-100 bg-emerald-50/50">
            <p className="text-sm font-semibold text-neutral-900">What next?</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600">
              {isFamily
                ? 'Everything is optional. Invite people, add kids, or skip and come back later.'
                : 'Everything is optional. Invite people when you are ready, or keep the group as just you for now.'}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => openGroupManage(detail.group.id, 'members', { focus: 'invite' })}
                className="ios-btn w-full border border-neutral-200 bg-white text-neutral-900"
              >
                <UserPlus className="h-4 w-4" />
                +Invite
              </button>
              {isFamily ? (
                <button
                  type="button"
                  onClick={() =>
                    openGroupManage(detail.group.id, 'members', { focus: 'add-kid' })
                  }
                  className="ios-btn w-full bg-emerald-600 text-white"
                >
                  <Baby className="h-4 w-4" />
                  Add Kids
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setSetupPromptGroupId(null);
                  setSuccess(null);
                }}
                className="text-sm font-semibold text-neutral-600 hover:text-neutral-900"
              >
                Skip for now
              </button>
            </div>
          </GlassCard>
        ) : null}
        <SettingsMenuGroup>
          <SettingsMenuRow
            label="Members"
            subtitle="Invite, add kids, manage roles"
            icon={Users}
            badge={detail.members.length || undefined}
            onClick={() => openGroupManage(detail.group.id, 'members')}
          />
          <SettingsMenuRow
            label={isActivity ? 'Outing crew chat' : 'Team chat'}
            subtitle={isActivity ? 'Everyone going on this outing' : PRODUCT_TEAM_CHAT_SUBTITLE}
            icon={MessageSquare}
            onClick={() => focusGroupChat(detail.group.id, activeSection)}
          />
          {isAdmin && !isActivity ? (
            <SettingsMenuRow
              label="Edit group"
              subtitle="Name, image, delete"
              icon={Settings2}
              onClick={() => openGroupManage(detail.group.id, 'edit')}
            />
          ) : null}
          {!isCreator && !isActivity ? (
            <SettingsMenuRow
              label="Leave group"
              subtitle="You can rejoin with a new invite"
              icon={LogOut}
              destructive
              onClick={() => setShowLeaveModal(true)}
            />
          ) : null}
        </SettingsMenuGroup>
      </div>
    );
  };

  const renderManageDetail = () => {
    if (!detail) return null;

    return (
      <div className="space-y-3">
        {activeSection === 'hub' && renderGroupHub()}
        {activeSection === 'members' && renderMembersSection()}
        {activeSection === 'edit' && renderEditSection()}
      </div>
    );
  };

  const renderGroupRows = (rows: SocialGroupView[]) =>
    rows.map((group) => {
      const isOutingChat = group.type === 'activity';
      const unread = group.chatPreview?.unreadCount ?? 0;
      const subtitle =
        unread > 0 ? `${unread} unread · ${typeLabel[group.type]}` : typeLabel[group.type];
      return (
        <SettingsMenuRow
          key={group.id}
          label={group.name}
          subtitle={subtitle}
          icon={Users}
          badge={unread > 0 ? unread : undefined}
          onClick={() => {
            if (isOutingChat) {
              focusGroupChat(group.id);
              return;
            }
            openGroupManage(group.id);
          }}
        />
      );
    });

  const renderGroupsList = () => (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="ios-btn shrink-0 bg-emerald-600 px-4 text-white"
        >
          <Plus className="h-4 w-4" />
          Create
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-12" role="status" aria-live="polite">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium text-neutral-600">Loading groups</p>
        </div>
      ) : socialGroups.length === 0 && outingGroups.length === 0 ? (
        <GlassCard padding className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50">
            <Users className="h-6 w-6 text-sky-600" aria-hidden />
          </div>
          <p className="font-semibold text-neutral-900">No groups yet</p>
          <p className="mt-1 text-sm text-neutral-500">
            Create a family or friends group. Invite people or add kids whenever you are ready.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="ios-btn mt-4 bg-emerald-600 text-white md:w-auto"
          >
            <Plus className="h-4 w-4" />
            Create your first group
          </button>
        </GlassCard>
      ) : (
        <>
          <SettingsMenuGroup title="Family & friends">
            {socialGroups.length > 0 ? (
              renderGroupRows(socialGroups)
            ) : (
              <SettingsMenuRow
                label="Create a group"
                subtitle="Family or friends — invite by email"
                icon={Plus}
                onClick={() => setShowCreateModal(true)}
              />
            )}
          </SettingsMenuGroup>
          {outingGroups.length > 0 ? (
            <SettingsMenuGroup title="Outing chats">{renderGroupRows(outingGroups)}</SettingsMenuGroup>
          ) : null}
        </>
      )}
    </div>
  );

  return (
    <>
      <ConsumerShell
        layout="stack"
        title={shellTitle}
        maxWidth="7xl"
        showJourney={false}
        back={backChrome}
      >
        <div className="min-w-0 max-w-full space-y-3 pb-bottom-nav-safe animate-fade-up lg:space-y-2">
          {error ? (
            <GlassCard padding className="border-red-200/50 bg-red-50/50">
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => void loadGroups()}
                className="mt-2 text-sm font-semibold text-emerald-600"
              >
                Retry
              </button>
            </GlassCard>
          ) : null}
          {success ? (
            <GlassCard padding className="border-emerald-200/50 bg-emerald-50/50">
              <p className="text-sm text-emerald-800">{success}</p>
            </GlassCard>
          ) : null}
          {acceptingInvite ? (
            <GlassCard padding>
              <p className="text-sm text-neutral-600">Accepting group invite…</p>
            </GlassCard>
          ) : null}

          {showingGroupDetail ? (
            detail ? (
              renderManageDetail()
            ) : (
              <div className="flex flex-col items-center gap-3 py-12" role="status" aria-live="polite">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                <p className="text-sm font-medium text-neutral-600">Loading group</p>
              </div>
            )
          ) : (
            renderGroupsList()
          )}
        </div>
      </ConsumerShell>

      <Dialog open={showCreateModal} onClose={() => !saving && setShowCreateModal(false)} title="Create group">
        <p className="text-sm text-neutral-600 mb-4">
          Creates your group and its chat. You can invite people or add kids anytime from Members.
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
              onChange={(e) =>
                setGroupForm((prev) => ({
                  ...prev,
                  name: e.target.value.slice(0, SOCIAL_GROUP_NAME_MAX_LENGTH),
                }))
              }
              maxLength={SOCIAL_GROUP_NAME_MAX_LENGTH}
              placeholder="e.g. Weekend hikers"
              className="ios-input w-full text-[14px]"
            />
            <p className="mt-1 text-xs text-neutral-500">
              {groupForm.name.length}/{SOCIAL_GROUP_NAME_MAX_LENGTH} characters
            </p>
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
            disabled={
              saving ||
              groupForm.name.trim().length < 2 ||
              groupForm.name.trim().length > SOCIAL_GROUP_NAME_MAX_LENGTH
            }
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
    </>
  );
};
