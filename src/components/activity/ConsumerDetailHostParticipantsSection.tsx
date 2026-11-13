import type { ActivityDTO } from '@uaetrail/shared-types';
import type { ActivityManageCapabilities } from '../../activity/activityManageCapabilities';
import { ConsumerDetailSection } from '../../detail/shell/ConsumerDetailSection';
import { ActivityHostParticipantsRollcallEntry } from './ActivityHostParticipantsRollcallEntry';
import { ActivityJoinRequestCard } from '../../console/ActivityJoinRequestCard';
import type { ActivityRequestView } from '../../hooks/publishingJoinQueueClientApi';
export type ConsumerDetailHostParticipantsSurface = {
  tenantId: string;
  caps: ActivityManageCapabilities;
  joinRequests?: ActivityRequestView[];
  requestsLoading?: boolean;
  busyRequestId?: string | null;
  onParticipantsError?: (message: string) => void;
  onApproveJoinRequest?: (requestId: string) => void;
  onRejectJoinRequest?: (request: ActivityRequestView) => void;
};

/** Host manage — roster + check-in directly under key facts. */
export const ConsumerDetailHostParticipantsSection = ({
  activity,
  tenantId,
  caps,
  joinRequests = [],
  requestsLoading = false,
  busyRequestId = null,
  onParticipantsError,
  onApproveJoinRequest,
  onRejectJoinRequest,
}: {
  activity: ActivityDTO;
} & ConsumerDetailHostParticipantsSurface) => {
  return (
  <div className="space-y-3 lg:space-y-2.5">
      <ConsumerDetailSection
        id="activity-detail-host-participants"
        title="Participants"
        tone="slate"
        ariaLabel="Participants and check-in"
        collapsible
        defaultExpanded
        className="scroll-mt-28 md:scroll-mt-32 lg:scroll-mt-8"
      >
        <ActivityHostParticipantsRollcallEntry
          activityId={activity.id}
          tenantId={tenantId}
          joinRequests={joinRequests}
          requestsLoading={requestsLoading}
          busyRequestId={busyRequestId}
          onParticipantsError={onParticipantsError}
          onApproveJoinRequest={onApproveJoinRequest}
          onRejectJoinRequest={onRejectJoinRequest}
        />
      </ConsumerDetailSection>

      {caps.showJoinRequests ? (
        <ConsumerDetailSection
          id="activity-detail-host-join-requests"
          title="Join requests"
          tone="neutral"
          ariaLabel="Join requests"
          collapsible
          defaultExpanded
          className="scroll-mt-28 md:scroll-mt-32 lg:scroll-mt-8"
        >
          {requestsLoading ? (
            <p className="text-sm text-neutral-500">Loading requests…</p>
          ) : joinRequests.length === 0 ? (
            <p className="text-sm text-neutral-500">No pending requests for this outing.</p>
          ) : (
            <div className="space-y-2">
              {joinRequests.map((request) => (
                <ActivityJoinRequestCard
                  key={request.id}
                  request={request}
                  busy={busyRequestId === request.id}
                  onApprove={() => onApproveJoinRequest?.(request.id)}
                  onReject={() => onRejectJoinRequest?.(request)}
                />
              ))}
            </div>
          )}
        </ConsumerDetailSection>
      ) : null}
    </div>
  );
};
