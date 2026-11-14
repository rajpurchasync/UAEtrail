import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatExploreEventDateLabel, resolveHostNote } from '@uaetrail/shared-types';
import type { ActivityRequestView } from '../api/types';
import { resolveJoinRequestActivity } from '../utils/joinRequestActivity';
import { RideshareRiderReputationSummary } from '../components/rideshare/RideshareRiderReputationSummary';
import { MemberJoinProfileHostBlock } from '../components/profile/MemberJoinProfileHostBlock';
import { MemberMedicalSafetyHostBlock } from '../components/profile/MemberMedicalSafetyHostBlock';
import { GlassCard } from '../components/mobile/GlassCard';
import { AppButton } from '../components/mobile/AppButton';

const statusStyle: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-700',
  approved: 'bg-emerald-500/15 text-emerald-700',
  rejected: 'bg-red-500/15 text-red-600',
  cancelled: 'bg-neutral-500/10 text-neutral-500',
};

const formatDate = (value?: string) => (value ? formatExploreEventDateLabel(value) ?? '' : '');

interface ActivityJoinRequestCardProps {
  request: ActivityRequestView;
  onApprove?: () => void;
  onReject?: () => void;
  busy?: boolean;
  showActions?: boolean;
}

export const ActivityJoinRequestCard = ({
  request,
  onApprove,
  onReject,
  busy = false,
  showActions = true,
}: ActivityJoinRequestCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const isPending = request.status === 'pending';
  const activity = resolveJoinRequestActivity(request);
  const activityTitle = activity?.title || activity?.locationName || 'Activity';
  const activityDate = formatDate(activity?.date || activity?.startAt);
  const hostNote = resolveHostNote(request);
  const partyMembers = request.partyMembers ?? [];
  const partyLine =
    request.adults != null || request.kids != null || partyMembers.length > 0
      ? (() => {
          const a = request.adults ?? 1;
          const k = request.kids ?? 0;
          if (a === 1 && k === 0 && partyMembers.length === 0) return null;
          return `Group: ${a} adult${a === 1 ? '' : 's'}${
            k > 0 ? `, ${k} kid${k === 1 ? '' : 's'}` : ''
          }`;
        })()
      : null;
  const guestNote = request.note?.trim() || '';
  const showGuestNote = Boolean(guestNote) && guestNote !== partyLine;
  const memberStatusLabel = (status: string): string => {
    if (status === 'family_invited') return 'Family member invited';
    if (status === 'host_pending') return 'Awaiting host';
    if (status === 'accepted') return 'Accepted';
    if (status === 'confirmed') return 'Confirmed';
    if (status === 'declined') return 'Declined';
    return status;
  };

  return (
    <GlassCard padding className="!p-3.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {request.user?.displayName ?? 'Guest'}
          </p>
          <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
            {activityTitle}
            {activityDate ? ` · ${activityDate}` : ''}
          </p>
          {partyLine ? (
            <p className="mt-1 text-xs font-medium text-neutral-700 dark:text-neutral-300">{partyLine}</p>
          ) : null}
          {request.sourceTeamName ? (
            <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
              Team: {request.sourceTeamName}
            </p>
          ) : null}
          {partyMembers.length > 0 ? (
            <ul className="mt-1 space-y-0.5">
              {partyMembers.map((member) => (
                <li
                  key={member.membershipId}
                  className="text-[11px] text-neutral-600 dark:text-neutral-400"
                >
                  {member.displayName}
                  <span className="text-neutral-400"> · </span>
                  {member.memberType === 'kid' ? 'Kid' : 'Adult'}
                  <span className="text-neutral-400"> · </span>
                  {memberStatusLabel(member.status)}
                </li>
              ))}
            </ul>
          ) : null}
          {request.partyApprovalPending ? (
            <p className="mt-1 text-[11px] font-medium text-amber-800 dark:text-amber-200">
              Family headcount awaiting your approval
            </p>
          ) : null}
          {showGuestNote ? (
            <p className={`mt-1 text-xs text-neutral-600 dark:text-neutral-400 ${expanded ? '' : 'line-clamp-2'}`}>
              {guestNote}
            </p>
          ) : null}
          {request.rideshareRiderReputation ? (
            <RideshareRiderReputationSummary
              reputation={request.rideshareRiderReputation}
              compact={!expanded && Boolean(request.note)}
            />
          ) : null}
          <MemberJoinProfileHostBlock
            joinProfile={request.user?.joinProfile}
            compact={!expanded}
          />
          <MemberMedicalSafetyHostBlock
            medicalSafety={request.user?.medicalSafety}
            compact={!expanded}
          />
          {hostNote && !isPending && (
            <p className="text-xs text-neutral-500 mt-1 italic">
              {request.status === 'rejected' ? 'Sent to guest: ' : 'Note to guest: '}
              {hostNote}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
            statusStyle[request.status] ?? statusStyle.cancelled
          }`}
        >
          {request.status}
        </span>
      </div>

      {(showGuestNote || hostNote) && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
        >
          {expanded ? 'Show less' : 'View details'}
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      )}

      {isPending && showActions && onApprove && onReject && (
        <div className="mt-3 flex flex-wrap items-center gap-2 md:justify-end">
          <AppButton
            type="button"
            variant="primary"
            className="min-h-10 w-full px-3 text-sm md:w-auto md:min-h-9 md:min-w-[5.5rem] md:px-4"
            disabled={busy}
            onClick={onApprove}
          >
            Accept
          </AppButton>
          <AppButton
            type="button"
            variant="secondary"
            className="min-h-10 w-full border border-neutral-200 px-3 text-sm dark:border-neutral-600 dark:text-neutral-100 md:w-auto md:min-h-9 md:min-w-[5.5rem] md:px-4"
            disabled={busy}
            onClick={onReject}
          >
            Decline
          </AppButton>
        </div>
      )}

      {!isPending && activity?.id ? (
        <Link
          to={`/activity/${activity.id}`}
          className="mt-2 inline-block text-xs font-semibold text-emerald-700"
        >
          View activity
        </Link>
      ) : null}
    </GlassCard>
  );
};
