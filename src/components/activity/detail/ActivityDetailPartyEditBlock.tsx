import { useEffect, useMemo, useState } from 'react';
import type { ActivityDetailDTO, MyActivityRequestDTO } from '@uaetrail/shared-types';
import {
  GROUP_JOIN_APPROVAL_NOTE,
  GROUP_JOIN_EDIT_HEADLINE,
  GROUP_JOIN_EDIT_LEAD,
  GROUP_JOIN_SAVING,
} from '../../../content/groupJoinCopy';
import { ActivityFamilyPartyPicker } from './ActivityFamilyPartyPicker';
import { PartyJoinModePicker } from '../../../detail/shell/PartyJoinModePicker';
import { PartySizeSelect } from '../../../detail/shell/PartySizeSelect';
import { resolvePartyEditSeed } from '../../../detail/resolvePartyEditSeed';
import type { PartyJoinMode } from '../../../detail/partyJoinIntent';
import { usePersistedPartySize } from '../../../detail/usePersistedPartySize';
import { setPartySize, useSharedPartySize } from '../../../detail/partySizeState';

type Props = {
  activity: ActivityDetailDTO;
  myRequest: MyActivityRequestDTO;
  viewerUserId?: string | null;
};

export const ActivityDetailPartyEditBlock = ({ activity, myRequest, viewerUserId }: Props) => {
  const seed = resolvePartyEditSeed(myRequest);
  const [mode, setMode] = useState<PartyJoinMode>(seed.mode);
  const [teamId, setTeamId] = useState<string | null>(seed.teamId);
  const [membershipIds, setMembershipIds] = useState<string[]>(seed.membershipIds);
  const { adults, kids, setAdults, setKids } = useSharedPartySize();
  const { persist, saving, error } = usePersistedPartySize({
    activityId: activity.id,
    requestId: myRequest.id,
    enabled: true,
    seedAdults: myRequest.adults ?? 1,
    seedKids: myRequest.kids ?? 0,
  });

  const kidsAllowed =
    activity.audience?.kidsWelcome !== false &&
    !activity.requirements?.some((line) => line.trim().toLowerCase() === 'no children');

  const partySnapshotKey = useMemo(
    () =>
      [
        myRequest.id,
        myRequest.adults ?? 1,
        myRequest.kids ?? 0,
        myRequest.sourceTeamId ?? '',
        (myRequest.partyMembers ?? []).map((row) => `${row.membershipId}:${row.status}`).join('|'),
      ].join(':'),
    [
      myRequest.id,
      myRequest.adults,
      myRequest.kids,
      myRequest.sourceTeamId,
      myRequest.partyMembers,
    ]
  );

  useEffect(() => {
    const next = resolvePartyEditSeed(myRequest);
    setMode(next.mode);
    setTeamId(next.teamId);
    setMembershipIds(next.membershipIds);
    setPartySize({ adults: next.adults, kids: next.kids });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on partySnapshotKey only
  }, [partySnapshotKey]);

  const applyMode = (next: PartyJoinMode) => {
    setMode(next);
    if (next === 'me') {
      setAdults(1);
      setKids(0);
      persist(1, 0);
      return;
    }
    if (next === 'headcount') {
      persist(adults, kidsAllowed ? kids : 0);
      return;
    }
    setMembershipIds([]);
    setTeamId(null);
  };

  const onHeadcountAdults = (n: number) => {
    setAdults(n);
    if (mode === 'headcount') persist(n, kidsAllowed ? kids : 0);
  };

  const onHeadcountKids = (n: number) => {
    setKids(n);
    if (mode === 'headcount') persist(adults, kidsAllowed ? n : 0);
  };

  const onRosterChange = (ids: string[]) => {
    setMembershipIds(ids);
    if (mode === 'team' && ids.length > 0) {
      persist(1, 0, ids, teamId);
    }
  };

  const onTeamChange = (id: string | null) => {
    setTeamId(id);
    setMembershipIds([]);
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{GROUP_JOIN_EDIT_HEADLINE}</h3>
      <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{GROUP_JOIN_EDIT_LEAD}</p>
      <div className="mt-3 space-y-3">
        <PartyJoinModePicker mode={mode} onChange={applyMode} />
        {mode === 'headcount' ? (
          <PartySizeSelect
            adults={adults}
            kids={kidsAllowed ? kids : 0}
            onAdults={onHeadcountAdults}
            onKids={onHeadcountKids}
            compact
            joined
            kidsAllowed={kidsAllowed}
          />
        ) : null}
        {mode === 'team' ? (
          <ActivityFamilyPartyPicker
            enabled
            kidsAllowed={kidsAllowed}
            selectedMembershipIds={membershipIds}
            onChange={onRosterChange}
            onTeamIdChange={onTeamChange}
            viewerUserId={viewerUserId}
          />
        ) : null}
      </div>
      {saving ? (
        <p className="mt-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">{GROUP_JOIN_SAVING}</p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {myRequest.partyApprovalPending ? (
        <p className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-200">{GROUP_JOIN_APPROVAL_NOTE}</p>
      ) : null}
    </div>
  );
};