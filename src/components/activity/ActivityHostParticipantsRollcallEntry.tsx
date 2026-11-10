import { useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { ACTIVITY_ROLLCALL_OPEN_CTA } from '../../content/activityRollcallCopy';
import { ACTIVITY_ROLLCALL_STATUS_LABEL } from './activityRollcallStatus';
import { useActivityParticipantsRoster } from './useActivityParticipantsRoster';
import { ActivityRollcallSheet } from './ActivityRollcallSheet';
import type { ConsumerDetailHostParticipantsSurface } from './ConsumerDetailHostParticipantsSection';

export const ActivityHostParticipantsRollcallEntry = ({
  activityId,
  tenantId,
  joinRequests = [],
  requestsLoading = false,
  busyRequestId = null,
  onParticipantsError,
  onApproveJoinRequest,
  onRejectJoinRequest,
}: {
  activityId: string;
} & Pick<
  ConsumerDetailHostParticipantsSurface,
  | 'tenantId'
  | 'joinRequests'
  | 'requestsLoading'
  | 'busyRequestId'
  | 'onParticipantsError'
  | 'onApproveJoinRequest'
  | 'onRejectJoinRequest'
>) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { participants, attendedCount, loading } = useActivityParticipantsRoster(
    tenantId,
    activityId,
    onParticipantsError
  );

  const pendingCount = useMemo(
    () => joinRequests.filter((r) => r.status === 'pending').length,
    [joinRequests]
  );
  const joinedCount = useMemo(
    () => participants.filter((p) => p.status === 'going').length,
    [participants]
  );

  const statItems = [
    { label: ACTIVITY_ROLLCALL_STATUS_LABEL.pending, count: pendingCount },
    { label: ACTIVITY_ROLLCALL_STATUS_LABEL.joined, count: joinedCount },
    { label: ACTIVITY_ROLLCALL_STATUS_LABEL.attending, count: attendedCount },
  ];

  return (
    <>
      <div className="space-y-3">
        <dl className="grid grid-cols-3 gap-2">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-neutral-200/80 bg-white px-2 py-2 text-center"
            >
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                {item.label}
              </dt>
              <dd className="mt-0.5 text-lg font-bold tabular-nums text-neutral-900">
                {requestsLoading && item.label === ACTIVITY_ROLLCALL_STATUS_LABEL.pending
                  ? '—'
                  : loading && item.label !== ACTIVITY_ROLLCALL_STATUS_LABEL.pending
                    ? '—'
                    : item.count}
              </dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white active:bg-emerald-700"
        >
          <ClipboardList className="h-4 w-4" aria-hidden />
          {ACTIVITY_ROLLCALL_OPEN_CTA}
        </button>
      </div>

      <ActivityRollcallSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tenantId={tenantId}
        activityId={activityId}
        pendingRequests={joinRequests}
        busyRequestId={busyRequestId}
        onParticipantsError={onParticipantsError}
        onApproveJoinRequest={onApproveJoinRequest}
        onRejectJoinRequest={onRejectJoinRequest}
      />
    </>
  );
};
