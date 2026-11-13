import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
} from 'lucide-react';
import type {
  FamilyKidGender,
  SocialGroupInviteView,
  SocialGroupMemberView,
  SocialGroupView,
} from '../api/types';
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
import { groupWallPostPolicyLabel, resolveGroupWallPostPolicy } from '../utils/groupWallPostPolicy';
import {
  BUDDIES_PATH,
  GROUPS_PATH,
  groupsManagePath,
  PROFILE_SETTINGS_ACCOUNT_PATH,
  type GroupManageSection,
} from '../config/surfacePaths';
import {
  PRODUCT_GROUPS_SURFACE_LABEL,
  PRODUCT_SOCIAL_SURFACE_TITLE,
} from '../content/productNorthStar';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { navigateToGroupChatFromSocial } from '../utils/activityGroupChatNav';
import { GlassCard } from '../components/mobile/GlassCard';
import { Dialog } from '../components/ui/Dialog';
import { AppSelect } from '../components/ui/AppSelect';
import { SecureAvatar } from '../components/ui/SecureAvatar';
import { ProfilePhotoEditorField } from '../components/account/ProfilePhotoEditorField';
import {
  SettingsContentGroup,
  SettingsMenuGroup,
  SettingsMenuRow,
} from '../components/settings/SettingsMenuRow';
import { updateMyGroupSettings } from '../hooks/socialGroupSettingsApi';
import { useAuth } from '../context/AuthContext';
import { useMeProfile } from '../hooks/useMeProfile';
import { USER_GENDER_OPTIONS, type UserGender } from '../constants/userProfileOptions';
import type { MobileBackChrome } from '../utils/mobileBackNav';

type GroupType = 'family' | 'friends';

const parseGroupSection = (section: string | null, legacyTab: string | null): GroupManageSection => {
  if (section === 'members' || section === 'invite' || section === 'kids' || section === 'settings') {
    return section;
  }
  if (legacyTab === 'members') return 'members';
  if (legacyTab === 'manage') return 'settings';
  return 'hub';
};

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

const KID_EMERGENCY_ME_RELATION = 'Me';

const KID_EMERGENCY_RELATION_OPTIONS = [
  { value: 'Parent', label: 'Parent' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Father', label: 'Father' },
  { value: 'Guardian', label: 'Guardian' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Other', label: 'Other' },
];

const emptyKidForm = {
  displayName: '',
  dateOfBirth: '',
  emergencyContactIsMe: true,
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: KID_EMERGENCY_ME_RELATION,
  medicalConditions: '',
  gender: '' as FamilyKidGender | '',
  photoUrl: '',
};

const MANAGE_SECTION_TITLES: Record<Exclude<GroupManageSection, 'hub'>, string> = {
  members: 'Members',
  invite: 'Invite',
  kids: 'Kids',
  settings: 'Settings',
};

const normalizePhoneKey = (value: string | null | undefined): string =>
  (value ?? '').replace(/\D/g, '');

const kidFormFromMember = (
  member: SocialGroupMemberView,
  me?: { name: string; phone: string }
) => {
  const relation = (member.emergencyContactRelation ?? '').trim();
  const phone = member.emergencyContactPhone ?? '';
  const isMe =
    relation.toLowerCase() === 'me' ||
    (Boolean(me?.phone) &&
      normalizePhoneKey(phone) === normalizePhoneKey(me?.phone) &&
      Boolean(me?.name) &&
      (member.emergencyContactName ?? '').trim().toLowerCase() === (me?.name ?? '').trim().toLowerCase());
  return {
    displayName: member.displayName ?? '',
    dateOfBirth: toDateInputValue(member.dateOfBirth),
    emergencyContactIsMe: isMe,
    emergencyContactName: member.emergencyContactName ?? '',
    emergencyContactPhone: phone,
    emergencyContactRelation: isMe
      ? KID_EMERGENCY_ME_RELATION
      : relation || 'Parent',
    medicalConditions: member.medicalConditions ?? '',
    gender: (member.gender ?? '') as FamilyKidGender | '',
    photoUrl: member.photoUrl ?? '',
  };
};

const toDateInputValue = (value: string | null | undefined): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
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
    parseGroupSection(searchParams.get('section'), searchParams.get('tab'))
  );

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

  const resolvedKidEmergency = useMemo(() => {
    if (kidForm.emergencyContactIsMe) {
      return {
        name: meEmergency.name,
        phone: meEmergency.phone,
        relation: KID_EMERGENCY_ME_RELATION,
      };
    }
    return {
      name: kidForm.emergencyContactName.trim(),
      phone: kidForm.emergencyContactPhone.trim(),
      relation: kidForm.emergencyContactRelation.trim(),
    };
  }, [
    kidForm.emergencyContactIsMe,
    kidForm.emergencyContactName,
    kidForm.emergencyContactPhone,
    kidForm.emergencyContactRelation,
    meEmergency.name,
    meEmergency.phone,
  ]);

  const kidFormReady =
    kidForm.displayName.trim().length >= 2 &&
    Boolean(kidForm.dateOfBirth) &&
    resolvedKidEmergency.name.length >= 2 &&
    resolvedKidEmergency.phone.length >= 8 &&
    resolvedKidEmergency.relation.length >= 1 &&
    kidForm.medicalConditions.trim().length >= 1;

  const showingGroupDetail = Boolean(selectedGroupId);

  const shellTitle = useMemo(() => {
    if (!showingGroupDetail) return PRODUCT_GROUPS_SURFACE_LABEL;
    if (activeSection === 'hub') return detail?.group.name ?? 'Group';
    return MANAGE_SECTION_TITLES[activeSection];
  }, [activeSection, detail?.group.name, showingGroupDetail]);

  const backChrome = useMemo((): MobileBackChrome => {
    if (!showingGroupDetail) {
      return {
        fallbackTo: BUDDIES_PATH,
        label: PRODUCT_SOCIAL_SURFACE_TITLE,
        backBehavior: 'fallback',
      };
    }
    if (activeSection === 'hub') {
      return {
        fallbackTo: GROUPS_PATH,
        label: PRODUCT_GROUPS_SURFACE_LABEL,
        backBehavior: 'fallback',
      };
    }
    return {
      fallbackTo: groupsManagePath(selectedGroupId as string),
      label: detail?.group.name ?? 'Group',
      backBehavior: 'fallback',
    };
  }, [activeSection, detail?.group.name, selectedGroupId, showingGroupDetail]);

  const processedInviteRef = useRef<string | null>(null);
  const inviteToken = searchParams.get('invite');

  useEffect(() => {
    const groupId = searchParams.get('group');
    if (!groupId) return;
    const section = searchParams.get('section');
    const tab = searchParams.get('tab');
    if (section || !tab) return;
    // Legacy ?tab=members|manage → settings-style ?section=
    if (tab === 'members') {
      navigate(groupsManagePath(groupId, 'members'), { replace: true });
      return;
    }
    if (tab === 'manage') {
      navigate(groupsManagePath(groupId, 'settings'), { replace: true });
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

  const openGroupManage = (groupId: string, section: GroupManageSection = 'hub') => {
    setSelectedGroupId(groupId);
    setActiveSection(section);
    setSearchParams(
      () => {
        const next = new URLSearchParams();
        next.set('group', groupId);
        if (section !== 'hub') next.set('section', section);
        return next;
      },
      { replace: true }
    );
  };

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
    setActiveSection(parseGroupSection(searchParams.get('section'), searchParams.get('tab')));
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
        name: groupForm.name,
        slogan: groupForm.slogan || undefined,
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
          ? 'Family group created. Add kids, invite adults, or skip for now.'
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

  const renderGroupIconCard = () => {
    if (!detail || !isAdmin) return null;
    const { group } = detail;
    const isActivity = group.type === 'activity';

    return (
      <GlassCard padding>
        <h3 className="text-sm font-semibold text-neutral-900 mb-2">Group image</h3>
        {isActivity ? (
          <>
            <div className="flex items-center gap-3">
              <SecureAvatar
                src={group.photoUrl ?? undefined}
                name={group.name}
                className="h-14 w-14 shrink-0 text-base ring-1 ring-black/10"
              />
              <p className="text-xs leading-relaxed text-neutral-500">
                Outing crew chats use the outing cover photo (256px-friendly in chat and inbox). Change it by
                updating the activity images — it syncs here automatically.
              </p>
            </div>
          </>
        ) : (
          <>
            <ProfilePhotoEditorField
              value={group.photoUrl ?? undefined}
              name={group.name}
              label="Icon"
              editorTitle="Edit group icon"
              keyPrefix={`groups/${group.id}`}
              kind="group-photo"
              disabled={saving}
              onChange={(url) => void saveGroupPhoto(group.id, url)}
            />
            <p className="mt-2 text-xs text-neutral-500">
              Circular crop · saved at 256×256 for fast load in chat, groups, and inbox.
            </p>
          </>
        )}
      </GlassCard>
    );
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
                <div
                  key={member.id}
                  className="rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2.5 flex items-start justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {member.photoUrl ? (
                      <SecureAvatar
                        src={member.photoUrl}
                        name={member.displayName || 'Kid'}
                        className="h-9 w-9 shrink-0 text-xs"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                        <Baby className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {member.displayName || 'Kid profile'}
                      </p>
                      <p className="text-xs text-neutral-600">
                        {member.profileComplete ? 'Ready for outings' : 'Profile incomplete'}
                        {member.gender
                          ? ` · ${USER_GENDER_OPTIONS.find((o) => o.value === member.gender)?.label ?? member.gender}`
                          : ''}
                        {member.dateOfBirth
                          ? ` · Born ${toDateInputValue(member.dateOfBirth)}`
                          : ''}
                      </p>
                    </div>
                  </div>
                  {isAdmin ? (
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingKidId(member.id);
                          setKidForm(kidFormFromMember(member, meEmergency));
                          openGroupManage(detail.group.id, 'kids');
                        }}
                        className="text-[11px] rounded-lg bg-white px-2 py-1 text-sky-800 border border-sky-200"
                      >
                        Edit
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
                  ) : null}
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    );
  };

  const finishGroupSetup = () => {
    if (!detail) return;
    setSetupPromptGroupId(null);
    setSuccess(null);
    openGroupManage(detail.group.id, 'hub');
  };

  const renderInviteSection = () => {
    if (!detail || !isAdmin) return null;
    const isFamily = detail.group.type === 'family';

    return (
      <div className="space-y-3">
        <SettingsContentGroup title="Invite adults">
          <p className="mb-3 text-xs leading-relaxed text-neutral-500">
            Optional — invite adults by email when you are ready. You can skip this and only add kids, or
            leave the group as just you for now.
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
            onClick={() => void sendMemberInvite()}
            className="ios-btn mt-3 w-full bg-emerald-600 text-white sm:w-auto"
          >
            <Mail className="h-4 w-4" />
            Send invite
          </button>
          {inviteLink ? (
            <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-700">
              <p className="mb-1 font-semibold">Share invite link</p>
              <p className="break-all text-neutral-600">{inviteLink}</p>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1 font-semibold text-emerald-700"
                onClick={async () => {
                  await navigator.clipboard.writeText(inviteLink);
                  setSuccess('Invite link copied.');
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy invite link
              </button>
            </div>
          ) : null}
        </SettingsContentGroup>

        {pendingInvites.length > 0 ? (
          <SettingsContentGroup title="Pending invites">
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="rounded-xl border border-neutral-100 px-3 py-2.5">
                  <p className="text-sm font-semibold text-neutral-900">{invite.email}</p>
                  <p className="text-xs capitalize text-neutral-600">
                    {invite.role} · {invite.status}
                  </p>
                </div>
              ))}
            </div>
          </SettingsContentGroup>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          {isFamily ? (
            <button
              type="button"
              onClick={() => openGroupManage(detail.group.id, 'kids')}
              className="ios-btn flex-1 border border-emerald-200 bg-emerald-50 text-emerald-800"
            >
              <Baby className="h-4 w-4" />
              Add kids instead
            </button>
          ) : null}
          <button
            type="button"
            onClick={finishGroupSetup}
            className="ios-btn flex-1 border border-neutral-200 bg-white text-neutral-800"
          >
            Done for now
          </button>
        </div>
      </div>
    );
  };

  const renderKidsSection = () => {
    if (!detail || detail.group.type !== 'family') return null;

    return (
      <div className="space-y-3">
        {isAdmin ? (
          <SettingsContentGroup title={editingKidId ? 'Edit kid profile' : 'Add kid profile'}>
            <p className="mb-3 text-xs leading-snug text-neutral-600">
              Optional for now — add kid profiles when you need them for outings. You can also invite
              adults later.
            </p>
            <div className="space-y-3">
              <ProfilePhotoEditorField
                value={kidForm.photoUrl || undefined}
                name={kidForm.displayName.trim() || 'Kid'}
                label="Photo"
                editorTitle="Kid photo"
                keyPrefix="family-kids"
                kind="avatar"
                disabled={saving}
                onChange={(photoUrl) => setKidForm((prev) => ({ ...prev, photoUrl }))}
              />
              <input
                value={kidForm.displayName}
                onChange={(e) => setKidForm((prev) => ({ ...prev, displayName: e.target.value }))}
                placeholder="Display name"
                className="ios-input w-full text-[14px]"
              />
              <div>
                <p className="mb-2 text-sm font-semibold text-neutral-800">Gender</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {USER_GENDER_OPTIONS.map((option) => {
                    const active = kidForm.gender === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          setKidForm((prev) => ({
                            ...prev,
                            gender: option.value as UserGender,
                          }))
                        }
                        className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                          active
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                            : 'border-neutral-200 bg-neutral-50 text-neutral-800 hover:border-emerald-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <input
                type="date"
                value={kidForm.dateOfBirth}
                onChange={(e) => setKidForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                className="ios-input w-full text-[14px]"
                aria-label="Date of birth"
              />
              <div className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50/80 p-3">
                <p className="text-sm font-semibold text-neutral-800">Emergency contact</p>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={kidForm.emergencyContactIsMe}
                    disabled={saving}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setKidForm((prev) =>
                        checked
                          ? {
                              ...prev,
                              emergencyContactIsMe: true,
                              emergencyContactRelation: KID_EMERGENCY_ME_RELATION,
                              emergencyContactName: meEmergency.name,
                              emergencyContactPhone: meEmergency.phone,
                            }
                          : {
                              ...prev,
                              emergencyContactIsMe: false,
                              emergencyContactRelation: 'Parent',
                              emergencyContactName: '',
                              emergencyContactPhone: '',
                            }
                      );
                    }}
                    className="mt-1 h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-neutral-900">Me</span>
                    <span className="mt-0.5 block text-xs text-neutral-500">
                      Use your name and phone as this kid&apos;s emergency contact
                    </span>
                  </span>
                </label>
                {kidForm.emergencyContactIsMe ? (
                  <div className="rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm text-neutral-700">
                    {meEmergency.name && meEmergency.phone ? (
                      <p>
                        <span className="font-semibold text-neutral-900">{meEmergency.name}</span>
                        <span className="text-neutral-400"> · </span>
                        Me
                        <span className="text-neutral-400"> · </span>
                        {meEmergency.phone}
                      </p>
                    ) : (
                      <p className="text-amber-800">
                        Add your phone in{' '}
                        <Link
                          to={PROFILE_SETTINGS_ACCOUNT_PATH}
                          className="font-semibold text-emerald-700 underline"
                        >
                          Account settings
                        </Link>{' '}
                        so hosts can reach you.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      value={kidForm.emergencyContactName}
                      onChange={(e) =>
                        setKidForm((prev) => ({ ...prev, emergencyContactName: e.target.value }))
                      }
                      placeholder="Name"
                      className="ios-input w-full text-[14px]"
                      aria-label="Emergency contact name"
                    />
                    <AppSelect
                      value={
                        KID_EMERGENCY_RELATION_OPTIONS.some(
                          (o) => o.value === kidForm.emergencyContactRelation
                        )
                          ? kidForm.emergencyContactRelation
                          : 'Other'
                      }
                      onChange={(relation) =>
                        setKidForm((prev) => ({ ...prev, emergencyContactRelation: relation }))
                      }
                      options={KID_EMERGENCY_RELATION_OPTIONS}
                      aria-label="Relation"
                    />
                    <input
                      value={kidForm.emergencyContactPhone}
                      onChange={(e) =>
                        setKidForm((prev) => ({ ...prev, emergencyContactPhone: e.target.value }))
                      }
                      placeholder="Number (+971…)"
                      className="ios-input w-full text-[14px]"
                      aria-label="Emergency contact number"
                      type="tel"
                    />
                  </div>
                )}
              </div>
              <textarea
                value={kidForm.medicalConditions}
                onChange={(e) =>
                  setKidForm((prev) => ({ ...prev, medicalConditions: e.target.value }))
                }
                placeholder="Medical conditions (or N/A)"
                rows={2}
                className="ios-input w-full resize-y text-[14px]"
              />
              <div className="flex gap-2">
                {editingKidId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingKidId(null);
                      setKidForm(emptyKidForm);
                    }}
                    className="ios-btn border border-neutral-200 bg-white text-neutral-800"
                  >
                    Cancel
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={saving || !kidFormReady}
                  onClick={async () => {
                    setSaving(true);
                    setError(null);
                    const payload = {
                      displayName: kidForm.displayName,
                      dateOfBirth: kidForm.dateOfBirth,
                      emergencyContactName: resolvedKidEmergency.name,
                      emergencyContactPhone: resolvedKidEmergency.phone,
                      emergencyContactRelation: resolvedKidEmergency.relation,
                      medicalConditions: kidForm.medicalConditions,
                      gender: kidForm.gender || null,
                      photoUrl: kidForm.photoUrl.trim() ? kidForm.photoUrl.trim() : null,
                    };
                    try {
                      if (editingKidId) {
                        await updateMeGroupKidMember(detail.group.id, editingKidId, payload);
                        setSuccess('Kid profile updated.');
                      } else {
                        await createMeGroupKidMember(detail.group.id, payload);
                        setSuccess('Kid profile added.');
                      }
                      setKidForm(emptyKidForm);
                      setEditingKidId(null);
                      await loadDetail(detail.group.id);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Could not save kid profile');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="ios-btn flex-1 bg-emerald-600 text-white disabled:opacity-50"
                >
                  <Baby className="h-4 w-4" />
                  {editingKidId ? 'Save kid' : 'Add kid'}
                </button>
              </div>
            </div>
          </SettingsContentGroup>
        ) : null}

        {kidMembers.length > 0 ? (
          <SettingsContentGroup title={`Kids (${kidMembers.length})`}>
            <div className="space-y-2">
              {kidMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {member.photoUrl ? (
                      <SecureAvatar
                        src={member.photoUrl}
                        name={member.displayName || 'Kid'}
                        className="h-9 w-9 text-xs"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                        <Baby className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900">
                        {member.displayName || 'Kid profile'}
                      </p>
                      <p className="text-xs text-neutral-600">
                        {member.profileComplete ? 'Ready for outings' : 'Profile incomplete'}
                        {member.gender
                          ? ` · ${USER_GENDER_OPTIONS.find((o) => o.value === member.gender)?.label ?? member.gender}`
                          : ''}
                        {member.dateOfBirth ? ` · Born ${toDateInputValue(member.dateOfBirth)}` : ''}
                      </p>
                    </div>
                  </div>
                  {isAdmin ? (
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingKidId(member.id);
                          setKidForm(kidFormFromMember(member, meEmergency));
                        }}
                        className="rounded-lg border border-sky-200 bg-white px-2 py-1 text-[11px] text-sky-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeMember(member.id)}
                        disabled={memberActionId === member.id}
                        className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] text-rose-800 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </SettingsContentGroup>
        ) : null}

        {isAdmin ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => openGroupManage(detail.group.id, 'invite')}
              className="ios-btn flex-1 border border-neutral-200 bg-white text-neutral-800"
            >
              <UserPlus className="h-4 w-4" />
              Invite adults
            </button>
            <button
              type="button"
              onClick={finishGroupSetup}
              className="ios-btn flex-1 border border-neutral-200 bg-white text-neutral-800"
            >
              Done for now
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  const renderSettingsSection = () => {
    if (!detail) return null;

    const wallPolicy = resolveGroupWallPostPolicy(detail.group);

    return (
      <div className="space-y-3">
        {renderGroupIconCard()}
        <SettingsContentGroup title="Group chat">
          <p className="text-xs text-neutral-500">
            Who can post:{' '}
            <span className="font-medium text-neutral-800">{groupWallPostPolicyLabel[wallPolicy]}</span>
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Admins change this from the gear icon inside the chat thread.
          </p>
          <button
            type="button"
            onClick={() => focusGroupChat(detail.group.id, 'settings')}
            className="ios-btn mt-3 border border-neutral-200 bg-white text-neutral-800"
          >
            <MessageSquare className="h-4 w-4" aria-hidden />
            Open chat
          </button>
        </SettingsContentGroup>

        {isCreator ? (
          <SettingsContentGroup title="Danger zone">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-red-900">Delete group</p>
                <p className="mt-1 text-xs leading-relaxed text-red-700/90">
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
                  <Trash2 className="h-4 w-4" />
                  Delete group
                </button>
              </div>
            </div>
          </SettingsContentGroup>
        ) : null}
      </div>
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
                ? 'Everything is optional. Invite adults, add kids only, or keep the group as just you and come back later.'
                : 'Everything is optional. Invite people when you are ready, or keep the group as just you for now.'}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => openGroupManage(detail.group.id, 'invite')}
                className="ios-btn w-full border border-neutral-200 bg-white text-neutral-900"
              >
                <UserPlus className="h-4 w-4" />
                Invite adults
              </button>
              {isFamily ? (
                <button
                  type="button"
                  onClick={() => openGroupManage(detail.group.id, 'kids')}
                  className="ios-btn w-full bg-emerald-600 text-white"
                >
                  <Baby className="h-4 w-4" />
                  Add kids only
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
          {isAdmin ? (
            <SettingsMenuRow
              label="Invite adults"
              subtitle="Optional — by email anytime"
              icon={UserPlus}
              onClick={() => openGroupManage(detail.group.id, 'invite')}
            />
          ) : null}
          <SettingsMenuRow
            label="Members"
            subtitle="Adults in this group"
            icon={Users}
            badge={adultMembers.length}
            onClick={() => openGroupManage(detail.group.id, 'members')}
          />
          {isFamily ? (
            <SettingsMenuRow
              label="Kids"
              subtitle="Optional profiles for outings"
              icon={Baby}
              badge={kidMembers.length || undefined}
              onClick={() => openGroupManage(detail.group.id, 'kids')}
            />
          ) : null}
          <SettingsMenuRow
            label="Open chat"
            subtitle={isActivity ? 'Outing crew thread' : 'Message your group'}
            icon={MessageSquare}
            onClick={() => focusGroupChat(detail.group.id, activeSection)}
          />
          {isAdmin && !isActivity ? (
            <SettingsMenuRow
              label="Group settings"
              subtitle="Image, chat policy, delete"
              icon={Settings2}
              onClick={() => openGroupManage(detail.group.id, 'settings')}
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
        {activeSection === 'members' && renderMembersTab()}
        {activeSection === 'invite' && renderInviteSection()}
        {activeSection === 'kids' && renderKidsSection()}
        {activeSection === 'settings' && renderSettingsSection()}
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
        <div className="min-w-0 max-w-full space-y-3 pb-nav-safe animate-fade-up lg:space-y-2">
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
          Creates your group and its chat. Afterward you can invite adults, add kids, or skip and do that
          later.
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
    </>
  );
};
