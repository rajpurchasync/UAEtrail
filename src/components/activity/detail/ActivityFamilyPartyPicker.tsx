import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Baby, UserPlus, Users } from 'lucide-react';
import type { SocialGroupMemberView, SocialGroupView } from '../../../api/types';
import { fetchMeGroupDetail, fetchMeGroups } from '../../../hooks/groupClientApi';
import {
  meFamilyPartyPickerGroupsQueryKey,
  meFamilyPartyPickerMembersQueryKey,
} from '../../../hooks/clientQueryKeys';
import { GROUPS_PATH, groupsManagePath } from '../../../config/routingCatalog';
import { AppSelect } from '../../ui/AppSelect';
import { AsyncLoadingState } from '../../ui/AsyncLoadingState';

const manageLinkClass =
  'mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 underline underline-offset-2';

type Props = {
  kidsAllowed: boolean;
  selectedMembershipIds: string[];
  onChange: (membershipIds: string[]) => void;
  /** Exclude the viewer's own adult membership from the list. */
  viewerUserId?: string | null;
  /** When false, skip network (CSS-hidden trees / closed sheets). */
  enabled?: boolean;
};

const adultSelectable = (member: SocialGroupMemberView, viewerUserId?: string | null): boolean => {
  if (member.memberType !== 'adult') return false;
  if (!member.userId) return false;
  if (viewerUserId && member.userId === viewerUserId) return false;
  if (member.isActive === false) return false;
  return true;
};

const kidSelectable = (member: SocialGroupMemberView, kidsAllowed: boolean): boolean => {
  if (member.memberType !== 'kid') return false;
  if (!kidsAllowed) return false;
  return Boolean(member.profileComplete);
};

/** Checklist of family-group members ready to attach to an outing. */
export const ActivityFamilyPartyPicker = ({
  kidsAllowed,
  selectedMembershipIds,
  onChange,
  viewerUserId,
  enabled = true,
}: Props) => {
  const [groupId, setGroupId] = useState<string | null>(null);

  const groupsQuery = useQuery({
    queryKey: meFamilyPartyPickerGroupsQueryKey,
    queryFn: async (): Promise<SocialGroupView[]> => {
      const groups = await fetchMeGroups();
      return groups.filter((g) => g.type === 'family');
    },
    enabled,
    staleTime: 60_000,
  });

  const familyGroups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);
  const familyGroupOptions = useMemo(
    () => familyGroups.map((group) => ({ value: group.id, label: group.name })),
    [familyGroups]
  );

  useEffect(() => {
    if (!enabled) return;
    setGroupId((prev) => prev ?? familyGroups[0]?.id ?? null);
  }, [enabled, familyGroups]);

  const membersQuery = useQuery({
    queryKey: groupId ? meFamilyPartyPickerMembersQueryKey(groupId) : ['me-family-party', 'members', ''],
    queryFn: async (): Promise<SocialGroupMemberView[]> => {
      const detail = await fetchMeGroupDetail(groupId!);
      return detail.members;
    },
    enabled: enabled && Boolean(groupId),
    staleTime: 60_000,
  });

  const members = membersQuery.data ?? [];
  const loading = groupsQuery.isLoading || (Boolean(groupId) && membersQuery.isLoading);
  const error =
    groupsQuery.error instanceof Error
      ? groupsQuery.error.message
      : membersQuery.error instanceof Error
        ? membersQuery.error.message
        : groupsQuery.error || membersQuery.error
          ? 'Could not load family groups.'
          : null;

  const selected = useMemo(() => new Set(selectedMembershipIds), [selectedMembershipIds]);

  const toggle = (membershipId: string, canToggle: boolean) => {
    if (!canToggle) return;
    if (selected.has(membershipId)) {
      onChange(selectedMembershipIds.filter((id) => id !== membershipId));
      return;
    }
    onChange([...selectedMembershipIds, membershipId]);
  };

  if (!enabled) return null;

  if (loading) {
    return <AsyncLoadingState variant="section" label="Loading family…" rows={2} />;
  }

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  if (familyGroups.length === 0) {
    return (
      <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-200">
        <p>Create a Family group first, then invite adults and add kid profiles.</p>
        <Link to={GROUPS_PATH} className="font-semibold text-emerald-700 underline">
          Open Groups
        </Link>
      </div>
    );
  }

  const adults = members.filter((m) => adultSelectable(m, viewerUserId));
  const kidsReady = members.filter((m) => kidSelectable(m, kidsAllowed));
  const kidsIncomplete = members.filter((m) => m.memberType === 'kid' && !m.profileComplete);

  return (
    <div className="space-y-3">
      {familyGroups.length > 1 ? (
        <div>
          <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Family group</p>
          <AppSelect
            className="mt-1"
            value={groupId ?? ''}
            onChange={(next) => setGroupId(next || null)}
            options={familyGroupOptions}
            aria-label="Family group"
          />
        </div>
      ) : (
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {familyGroups[0]?.name ?? 'Family'}
        </p>
      )}

      <div className="space-y-1.5">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200">
          <Users className="h-3.5 w-3.5" aria-hidden />
          Adults
        </p>
        {adults.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-900/40">
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              No other adults in this family yet. Invite them by email — they must accept before you can
              attach them here.
            </p>
            {groupId ? (
              <Link to={groupsManagePath(groupId, 'invite')} className={manageLinkClass}>
                <UserPlus className="h-3.5 w-3.5" aria-hidden />
                Invite adults
              </Link>
            ) : null}
          </div>
        ) : (
          adults.map((member) => {
            const label =
              member.user?.displayName || member.user?.email || member.displayName || 'Adult';
            return (
              <label
                key={member.id}
                className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
              >
                <input
                  type="checkbox"
                  checked={selected.has(member.id)}
                  onChange={() => toggle(member.id, true)}
                  className="h-4 w-4 accent-emerald-600"
                />
                <span className="min-w-0 truncate font-medium text-neutral-900 dark:text-neutral-100">
                  {label}
                </span>
              </label>
            );
          })
        )}
        {adults.length > 0 && groupId ? (
          <Link to={groupsManagePath(groupId, 'invite')} className={manageLinkClass}>
            <UserPlus className="h-3.5 w-3.5" aria-hidden />
            Invite more adults
          </Link>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200">
          <Baby className="h-3.5 w-3.5" aria-hidden />
          Kids
        </p>
        {!kidsAllowed ? (
          <p className="text-xs text-amber-800 dark:text-amber-200">
            This outing does not allow children.
          </p>
        ) : kidsReady.length === 0 && kidsIncomplete.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-900/40">
            <p className="text-xs text-neutral-600 dark:text-neutral-300">No kid profiles yet.</p>
            {groupId ? (
              <Link to={groupsManagePath(groupId, 'kids')} className={manageLinkClass}>
                <Baby className="h-3.5 w-3.5" aria-hidden />
                Add kids
              </Link>
            ) : null}
          </div>
        ) : (
          <>
            {kidsReady.map((member) => (
              <label
                key={member.id}
                className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
              >
                <input
                  type="checkbox"
                  checked={selected.has(member.id)}
                  onChange={() => toggle(member.id, true)}
                  className="h-4 w-4 accent-emerald-600"
                />
                <span className="min-w-0 truncate font-medium text-neutral-900 dark:text-neutral-100">
                  {member.displayName || 'Kid'}
                </span>
              </label>
            ))}
            {kidsIncomplete.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm dark:border-amber-900 dark:bg-amber-950/30"
              >
                <span className="min-w-0 truncate text-neutral-800 dark:text-neutral-100">
                  {member.displayName || 'Kid'} · incomplete
                </span>
                {groupId ? (
                  <Link
                    to={groupsManagePath(groupId, 'kids')}
                    className="shrink-0 text-xs font-semibold text-emerald-700 underline"
                  >
                    Finish profile
                  </Link>
                ) : null}
              </div>
            ))}
            {groupId ? (
              <Link to={groupsManagePath(groupId, 'kids')} className={manageLinkClass}>
                <Baby className="h-3.5 w-3.5" aria-hidden />
                Manage kids
              </Link>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};
