import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { resolveHostNote } from '@uaetrail/shared-types';
import type { ActivityRequestView } from '../api/types';
import { resolveJoinRequestActivity } from '../utils/joinRequestActivity';
import { RideshareRiderReputationSummary } from '../components/rideshare/RideshareRiderReputationSummary';
import { MemberMedicalSafetyHostBlock } from '../components/profile/MemberMedicalSafetyHostBlock';
import { GlassCard } from '../components/mobile/GlassCard';
import { AppButton } from '../components/mobile/AppButton';

const statusStyle: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-700',
  approved: 'bg-emerald-500/15 text-emerald-700',
  rejected: 'bg-red-500/15 text-red-600',
  cancelled: 'bg-neutral-500/10 text-neutral-500',
};

const formatDate = (value?: string) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

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

  return (
    <GlassCard padding className="!p-3.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-900 truncate">
            {request.user?.displayName ?? 'Guest'}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5 truncate">
            {activityTitle}
            {activityDate ? ` · ${activityDate}` : ''}
          </p>
          {request.note && (
            <p className={`text-xs text-neutral-600 mt-1 ${expanded ? '' : 'line-clamp-2'}`}>
              {request.note}
            </p>
          )}
          {request.rideshareRiderReputation ? (
            <RideshareRiderReputationSummary
              reputation={request.rideshareRiderReputation}
              compact={!expanded && Boolean(request.note)}
            />
          ) : null}
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

      {(request.note || hostNote) && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"
        >
          {expanded ? 'Show less' : 'View details'}
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      )}

      {isPending && showActions && onApprove && onReject && (
        <div className="mt-3 flex gap-2">
          <AppButton
            type="button"
            variant="primary"
            className="flex-1 min-h-[40px] px-3 text-sm"
            disabled={busy}
            onClick={onApprove}
          >
            Accept
          </AppButton>
          <AppButton
            type="button"
            variant="secondary"
            className="flex-1 min-h-[40px] px-3 text-sm"
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
