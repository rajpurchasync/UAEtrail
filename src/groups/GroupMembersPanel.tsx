import { useEffect, useMemo, useRef, useState } from 'react';
import { Baby, Copy, Mail, UserPlus, Users } from 'lucide-react';
import type { SocialGroupInviteView, SocialGroupMemberView, SocialGroupView } from '../api/types';
import { AppSelect } from '../components/ui/AppSelect';
import { SecureAvatar } from '../components/ui/SecureAvatar';
import { SettingsContentGroup } from '../components/settings/SettingsMenuRow';
import {
  PRODUCT_TEAM_KID_READY_LABEL,
  PRODUCT_TEAM_KID_ROSTER_NOTE,
} from '../content/productNorthStar';
import { KidTripDetailsForm } from './KidTripDetailsForm';
import { kidFormFromMember, toDateInputValue, type KidFormState } from './groupKidForm';

const MEMBER_ROLE_OPTIONS = [
  { value: 'buddy' as const, label: 'Member' },
  { value: 'admin' as const, label: 'Admin' },
];

type GroupMembersPanelProps = {
  group: SocialGroupView;
  members: SocialGroupMemberView[];
  membership: SocialGroupMemberView;
  invites: SocialGroupInviteView[];
  isAdmin: boolean;
  isCreator: boolean;
  adminUserId: string;
  saving: boolean;
  memberActionId: string | null;
  inviteEmail: string;
  inviteRole: 'buddy' | 'admin';
  inviteLink: string | null;
  onInviteEmailChange: (value: string) => void;
  onInviteRoleChange: (role: 'buddy' | 'admin') => void;
  onSendInvite: () => void;
  onCopyInviteLink: () => void;
  kidForm: KidFormState;
  onKidFormChange: (updater: (prev: KidFormState) => KidFormState) => void;
  editingKidId: string | null;
  onEditingKidIdChange: (id: string | null) => void;
  onResetKidForm: () => void;
  kidTripFormReady: boolean;
  onSaveKidTripDetails: () => void;
  onAddKidRoster: (displayName: string) => void;
  meEmergency: { name: string; phone: string };
  memberRoleLabel: (member: SocialGroupMemberView) => string;
  onChangeMemberRole: (memberId: string, role: 'buddy' | 'admin') => void;
  onToggleMemberAccess: (memberId: string, nextActive: boolean) => void;
  onRemoveMember: (memberId: string) => void;
  focusInvite?: boolean;
  focusAddKid?: boolean;
  showKidTripForm: boolean;
  onShowKidTripFormChange: (show: boolean) => void;
};

export const GroupMembersPanel = ({
  group,
  members,
  membership,
  invites,
  isAdmin,
  isCreator,
  adminUserId,
  saving,
  memberActionId,
  inviteEmail,
  inviteRole,
  inviteLink,
  onInviteEmailChange,
  onInviteRoleChange,
  onSendInvite,
  onCopyInviteLink,
  kidForm,
  onKidFormChange,
  editingKidId,
  onEditingKidIdChange,
  onResetKidForm,
  kidTripFormReady,
  onSaveKidTripDetails,
  onAddKidRoster,
  meEmergency,
  memberRoleLabel,
  onChangeMemberRole,
  onToggleMemberAccess,
  onRemoveMember,
  focusInvite,
  focusAddKid,
  showKidTripForm,
  onShowKidTripFormChange,
}: GroupMembersPanelProps) => {
  const inviteRef = useRef<HTMLDivElement>(null);
  const kidRosterRef = useRef<HTMLDivElement>(null);
  const [rosterKidName, setRosterKidName] = useState('');
  const isFamily = group.type === 'family';
  const pendingInvites = invites.filter((invite) => invite.status === 'pending');

  const roster = useMemo(() => {
    const adults = members.filter((m) => m.memberType === 'adult');
    const kids = members.filter((m) => m.memberType === 'kid');
    return [...adults, ...kids];
  }, [members]);

  useEffect(() => {
    if (focusInvite) inviteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusInvite]);

  useEffect(() => {
    if (focusAddKid || showKidTripForm) {
      kidRosterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusAddKid, showKidTripForm]);

  const canRemoveMember = (member: SocialGroupMemberView) => {
    if (member.id === membership.id) return false;
    if (member.memberType === 'adult' && member.userId === adminUserId) return false;
    return isAdmin;
  };

  const openKidTripForm = (member?: SocialGroupMemberView) => {
    if (member) {
      onEditingKidIdChange(member.id);
      onKidFormChange(() => kidFormFromMember(member, meEmergency));
    } else {
      onEditingKidIdChange(null);
      onResetKidForm();
    }
    onShowKidTripFormChange(true);
  };

  const cancelKidTripForm = () => {
    onEditingKidIdChange(null);
    onResetKidForm();
    onShowKidTripFormChange(false);
  };

  const rosterNameReady = rosterKidName.trim().length >= 2;

  const renderRosterRow = (member: SocialGroupMemberView) => {
    const isKid = member.memberType === 'kid';
    const displayName = isKid
      ? member.displayName || 'Kid'
      : member.user?.displayName || member.user?.email || 'Member';

    const kidMeta = isKid
      ? [
          member.profileComplete ? PRODUCT_TEAM_KID_READY_LABEL : 'Trip details needed',
          PRODUCT_TEAM_KID_ROSTER_NOTE,
          member.dateOfBirth ? `Born ${toDateInputValue(member.dateOfBirth)}` : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : `${memberRoleLabel(member)}${member.isActive === false ? ' · Disabled' : ''}`;

    return (
      <div
        key={member.id}
        className={`rounded-xl border px-3 py-2.5 flex items-start justify-between gap-3 ${
          isKid ? 'border-sky-100 bg-sky-50/60' : 'border-neutral-100 bg-white'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isKid ? (
            member.photoUrl ? (
              <SecureAvatar
                src={member.photoUrl}
                name={displayName}
                className="h-9 w-9 shrink-0 text-xs"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <Baby className="h-4 w-4" />
              </div>
            )
          ) : (
            <SecureAvatar
              src={member.user?.avatarUrl}
              name={displayName}
              className="h-9 w-9 shrink-0 text-sm"
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900 truncate">{displayName}</p>
            <p className="text-xs text-neutral-500">{kidMeta}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {isCreator &&
            !isKid &&
            member.memberType === 'adult' &&
            member.id !== membership.id &&
            member.userId !== adminUserId && (
              <AppSelect
                value={member.role}
                disabled={memberActionId === member.id}
                onChange={(role) => onChangeMemberRole(member.id, role)}
                options={MEMBER_ROLE_OPTIONS}
                size="compact"
                aria-label={`Change role for ${displayName}`}
              />
            )}
          {isKid && isAdmin ? (
            <div className="flex flex-wrap justify-end gap-1.5">
              <button
                type="button"
                onClick={() => openKidTripForm(member)}
                className="text-[11px] rounded-lg bg-white px-2 py-1 text-sky-800 border border-sky-200"
              >
                {member.profileComplete ? 'Edit trip details' : 'Trip details'}
              </button>
              {canRemoveMember(member) ? (
                <button
                  type="button"
                  onClick={() => onRemoveMember(member.id)}
                  disabled={memberActionId === member.id}
                  className="text-[11px] rounded-lg bg-rose-50 px-2 py-1 text-rose-800 disabled:opacity-50"
                >
                  Remove
                </button>
              ) : null}
            </div>
          ) : null}
          {!isKid && canRemoveMember(member) ? (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => onToggleMemberAccess(member.id, !(member.isActive ?? true))}
                disabled={memberActionId === member.id}
                className="text-[11px] rounded-lg bg-amber-50 px-2 py-1 text-amber-800 disabled:opacity-50"
              >
                {member.isActive === false ? 'Enable' : 'Disable'}
              </button>
              <button
                type="button"
                onClick={() => onRemoveMember(member.id)}
                disabled={memberActionId === member.id}
                className="text-[11px] rounded-lg bg-rose-50 px-2 py-1 text-rose-800 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {isAdmin ? (
        <div ref={inviteRef}>
          <SettingsContentGroup title="Invite adults">
            <p className="mb-2 text-xs text-neutral-600">
              Adults join with an account and can use optional team chat.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => onInviteEmailChange(e.target.value)}
                placeholder="member@email.com"
                className="ios-input min-w-0 flex-1 text-[14px]"
              />
              <AppSelect
                value={inviteRole}
                onChange={onInviteRoleChange}
                options={MEMBER_ROLE_OPTIONS}
                className="sm:w-36"
                aria-label="Invite role"
              />
            </div>
            <button
              type="button"
              disabled={saving || !inviteEmail.trim()}
              onClick={onSendInvite}
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
                  onClick={onCopyInviteLink}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy invite link
                </button>
              </div>
            ) : null}
          </SettingsContentGroup>
        </div>
      ) : null}

      <SettingsContentGroup title={`Roster (${roster.length})`}>
        <div className="space-y-2">
          {roster.length === 0 ? (
            <p className="text-sm text-neutral-500">No members yet besides you.</p>
          ) : (
            roster.map(renderRosterRow)
          )}
        </div>
        {isAdmin && isFamily ? (
          <div ref={kidRosterRef} className="mt-3 space-y-2 rounded-xl border border-sky-100 bg-sky-50/50 p-3">
            <p className="text-xs font-semibold text-sky-900">Kid under 12 (trips only)</p>
            <p className="text-[11px] text-sky-800/90">{PRODUCT_TEAM_KID_ROSTER_NOTE}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                value={rosterKidName}
                onChange={(e) => setRosterKidName(e.target.value)}
                placeholder="First name"
                className="ios-input min-w-0 flex-1 text-[14px]"
                disabled={saving}
              />
              <button
                type="button"
                disabled={saving || !rosterNameReady}
                onClick={() => {
                  const name = rosterKidName.trim();
                  onAddKidRoster(name);
                  setRosterKidName('');
                }}
                className="ios-btn border border-sky-200 bg-white text-sky-900 sm:shrink-0"
              >
                <UserPlus className="h-4 w-4" />
                Add to roster
              </button>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => openKidTripForm()}
              className="text-xs font-semibold text-sky-800 underline"
            >
              Add kid with full trip details instead
            </button>
          </div>
        ) : null}
      </SettingsContentGroup>

      {isAdmin && isFamily && showKidTripForm ? (
        <KidTripDetailsForm
          title={editingKidId ? 'Trip details' : 'Add kid with trip details'}
          kidForm={kidForm}
          saving={saving}
          formReady={kidTripFormReady}
          editingKidId={editingKidId}
          meEmergency={meEmergency}
          onKidFormChange={onKidFormChange}
          onCancelEdit={cancelKidTripForm}
          onSave={onSaveKidTripDetails}
        />
      ) : null}

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

      {roster.length === 0 && !isAdmin ? (
        <p className="flex items-center gap-2 text-sm text-neutral-500">
          <Users className="h-4 w-4" aria-hidden />
          Members appear here when they join.
        </p>
      ) : null}
    </div>
  );
};