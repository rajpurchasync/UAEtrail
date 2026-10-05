import { useEffect, useRef, useState } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import type { ActivityRequestView } from '../../api/index';
import { LinkRidesharePanel } from '../../explore/ui/LinkRidesharePanel';
import { hostActivityManageCapabilities } from '../../host/hostActivityManageCapabilities';
import { ActivityJoinRequestCard } from '../../console/ActivityJoinRequestCard';
import { ActivityJoinRequestDeclineDialog } from '../../console/ActivityJoinRequestDeclineDialog';
import { ActivityParticipantsPanel } from './ActivityParticipantsPanel';
import { HostActivityManageCancelDialogs } from '../activity/HostActivityManageCancelDialogs';
import { api } from '../../api/index';
import { resolveActivityTitle } from '../../utils/activityIdentity';
import { buildActivitySharePayload } from '../../utils/activityShare';
import { ActivityInviteModalBody } from '../activity/ActivityInviteModalBody';
import type { HostActivityManageActions } from '../../hooks/useHostActivityManageActions';
import { HostActivityDetailView } from './HostActivityDetailView';
import { HostActivityManageFooterActions } from './HostActivityManageFooterActions';
import { HostActivityManageOptionsSheet } from './HostActivityManageOptionsSheet';
import {
  hostActivityManageSubviewTitle,
  normalizeHostActivityManageView,
  type HostActivityManageInitialView,
  type HostActivityManageSubview,
} from './hostActivityManageViews';
import { tripsHostedActivityPath } from '../../trips/tripsRouting';
import { useModalA11y } from '../../hooks/useModalA11y';
import { useAuth } from '../../context/AuthContext';

export type ActivityManageSheetProps = {
  open: boolean;
  activity: ActivityDTO | null;
  tenantId: string | null;
  pendingRequests: ActivityRequestView[];
  actions: HostActivityManageActions;
  initialView?: HostActivityManageInitialView;
  onClose: () => void;
  onRequestsChanged: () => void | Promise<void>;
  onOpenPublicPage?: (activity: ActivityDTO) => void;
  onShare?: (activity: ActivityDTO) => void;
};

/** Full-screen manage surface for a hosted activity (Trips hosted + `/host/*`). */
export const ActivityManageSheet = ({
  open,
  activity,
  tenantId,
  pendingRequests,
  actions,
  initialView = 'overview',
  onClose,
  onRequestsChanged,
}: ActivityManageSheetProps) => {
  const { user } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<HostActivityManageSubview>('overview');
  const [manageOptionsOpen, setManageOptionsOpen] = useState(false);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [declineRequest, setDeclineRequest] = useState<ActivityRequestView | null>(null);
  const [rideshareNotice, setRideshareNotice] = useState<string | null>(null);
  const [activityRequests, setActivityRequests] = useState<ActivityRequestView[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  useModalA11y(open, onClose, panelRef);

  useEffect(() => {
    if (!open) return;
    setView(normalizeHostActivityManageView(initialView));
    setRideshareNotice(null);
    setManageOptionsOpen(false);
  }, [open, initialView, activity?.id]);

  useEffect(() => {
    if (!open || !activity?.id || !tenantId) {
      setActivityRequests([]);
      return;
    }
    setRequestsLoading(true);
    void api
      .getHostActivityJoinRequests(tenantId, { activityId: activity.id })
      .then((res) => {
        setActivityRequests(res.data.filter((request) => request.status === 'pending'));
      })
      .catch(() => {
        setActivityRequests(
          pendingRequests.filter((request) => request.activity?.id === activity.id && request.status === 'pending')
        );
      })
      .finally(() => setRequestsLoading(false));
  }, [open, activity?.id, tenantId, pendingRequests]);

  const caps = activity ? hostActivityManageCapabilities(activity) : null;

  const handleClose = () => {
    setView('overview');
    setRideshareNotice(null);
    setManageOptionsOpen(false);
    actions.setError(null);
    onClose();
  };

  const handleHeaderBack = () => {
    if (view === 'overview') {
      handleClose();
      return;
    }
    setView('overview');
    actions.setError(null);
  };

  const handleDelete = () => {
    if (!activity) return;
    if (activity.status === 'draft') {
      actions.setConfirmDelete(activity);
      return;
    }
    if (activity.status === 'published') {
      actions.setConfirmCancel(activity);
    }
  };

  const decideRequest = async (
    requestId: string,
    status: 'approved' | 'rejected',
    organizerNote?: string
  ) => {
    if (!tenantId) return;
    setBusyRequestId(requestId);
    try {
      await api.decideHostActivityJoinRequest(tenantId, requestId, status, organizerNote);
      if (status === 'rejected') setDeclineRequest(null);
      await onRequestsChanged();
    } catch (err) {
      actions.setError(err instanceof Error ? err.message : 'Could not update request.');
    } finally {
      setBusyRequestId(null);
    }
  };

  if (!open || !activity || !tenantId || !caps) return null;

  const title = resolveActivityTitle(activity);
  const headerTitle = hostActivityManageSubviewTitle(view, title);
  const chatReturnTo = tripsHostedActivityPath(
    activity.id,
    view === 'participants' ? 'checkin' : 'overview'
  );
  const inviteShare = buildActivitySharePayload({
    id: activity.id,
    title,
    activityType: activity.activityType,
    date: activity.date,
    locationName: activity.locationName,
  });

  return (
    <>
      <div className="fixed inset-0 z-[1500] flex flex-col bg-neutral-50">
        <header className="shrink-0 border-b border-neutral-200/80 bg-white pt-safe-plus-2">
          <div className="flex items-center gap-2 px-3 pb-2">
            <button
              type="button"
              onClick={handleHeaderBack}
              className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-neutral-600 active:bg-neutral-100"
            >
              {view === 'overview' ? 'Close' : 'Back'}
            </button>
            <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-semibold text-neutral-900">
              {headerTitle}
            </h1>
            <div className="w-[4.5rem] shrink-0" aria-hidden />
          </div>
        </header>

        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={headerTitle}
          className="min-h-0 flex-1 overflow-y-auto scroll-touch px-4 py-4 pb-4"
        >
          {actions.error ? (
            <p className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {actions.error}
            </p>
          ) : null}

          {view === 'participants' ? (
            <div className="mx-auto w-full max-w-2xl space-y-5">
              <p className="text-sm leading-relaxed text-neutral-600">
                See who is going and check people in on the day. Checked-in joiners can leave reviews and it counts
                toward their goals.
              </p>
              <ActivityParticipantsPanel
                tenantId={tenantId}
                activityId={activity.id}
                activityTitle={title}
                onError={(message) => actions.setError(message)}
              />
              {caps.showJoinRequests ? (
                <section className="space-y-2 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-neutral-800">
                    Join requests
                    {activityRequests.length > 0 ? ` (${activityRequests.length})` : ''}
                  </h3>
                  {requestsLoading ? (
                    <p className="text-sm text-neutral-500">Loading requests…</p>
                  ) : activityRequests.length === 0 ? (
                    <p className="text-sm text-neutral-500">No pending requests for this outing.</p>
                  ) : (
                    activityRequests.map((request) => (
                      <ActivityJoinRequestCard
                        key={request.id}
                        request={request}
                        busy={busyRequestId === request.id}
                        onApprove={() => void decideRequest(request.id, 'approved')}
                        onReject={() => setDeclineRequest(request)}
                      />
                    ))
                  )}
                </section>
              ) : null}
            </div>
          ) : null}

          {view === 'invite' ? (
            <div className="mx-auto w-full max-w-md">
              <ActivityInviteModalBody
                activityId={activity.id}
                messageWithUrl={inviteShare.messageWithUrl}
                active={Boolean(user)}
              />
            </div>
          ) : null}

          {view === 'rideshare' ? (
            <div className="mx-auto w-full max-w-2xl">
              {rideshareNotice ? (
                <p className="mb-3 text-sm font-medium text-emerald-700">{rideshareNotice}</p>
              ) : null}
              <LinkRidesharePanel
                tenantId={tenantId}
                parentActivityId={activity.id}
                onCreateRideshare={() => actions.createLinkedRideshare(activity)}
                onLinked={() => {
                  setRideshareNotice('Rideshare linked to this outing.');
                  void onRequestsChanged();
                }}
                onError={(message) => actions.setError(message)}
              />
            </div>
          ) : null}

          {view === 'overview' ? (
            <div className="mx-auto w-full max-w-2xl">
              <HostActivityDetailView activity={activity} />
            </div>
          ) : null}
        </div>

        <HostActivityManageFooterActions
          caps={caps}
          busy={actions.busy}
          onChat={async () => {
            const opened = await actions.openGroupChat(activity.id, activity.groupChatId, {
              returnTo: chatReturnTo,
            });
            if (opened) handleClose();
          }}
          onManage={() => setManageOptionsOpen(true)}
        />
      </div>

      <HostActivityManageOptionsSheet
        open={manageOptionsOpen}
        onClose={() => setManageOptionsOpen(false)}
        activity={activity}
        caps={caps}
        onSelectSubview={setView}
        onDuplicate={() => actions.reorganizeActivity(activity)}
        onDelete={handleDelete}
      />

      <ActivityJoinRequestDeclineDialog
        open={Boolean(declineRequest)}
        request={declineRequest}
        submitting={Boolean(declineRequest && busyRequestId === declineRequest.id)}
        onClose={() => setDeclineRequest(null)}
        onConfirm={(organizerNote) => {
          if (!declineRequest) return;
          return decideRequest(declineRequest.id, 'rejected', organizerNote);
        }}
      />

      <HostActivityManageCancelDialogs actions={actions} onAfterConfirm={handleClose} />
    </>
  );
};
