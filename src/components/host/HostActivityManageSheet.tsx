import { useEffect, useMemo, useRef, useState } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import type { ActivityRequestView } from '../../api/index';
import { LinkRidesharePanel } from '../../explore/ui/LinkRidesharePanel';
import { hostActivityManageCapabilities } from '../../host/hostActivityManageCapabilities';
import { OrganisationJoinRequestCard } from '../organisation-console/OrganisationJoinRequestCard';
import { OrganisationJoinRequestDeclineDialog } from '../organisation-console/OrganisationJoinRequestDeclineDialog';
import { OrganisationActivityCheckInPanel } from '../organisation-console/OrganisationActivityCheckInPanel';
import { OrganisationActivityHostConfirmDialogs } from './OrganisationActivityHostConfirmDialogs';
import { api } from '../../api/index';
import { resolveActivityTitle } from '../../utils/activityIdentity';
import { ActivityInviteSharePanel } from '../activity/ActivityInviteSharePanel';
import type { useOrganisationActivityHostActions } from '../../hooks/useOrganisationActivityHostActions';
import { HostActivityDetailView } from './HostActivityDetailView';
import { buildTripsHostedActivityMenuItems } from './buildTripsHostedActivityMenu';
import { HostActivityManageTopActions } from './HostActivityManageTopActions';
import { ActivityActionsMenu } from '../activities/ActivityActionsMenu';
import { tripsHostedActivityPath } from '../../trips/tripsRouting';
import { useModalA11y } from '../../hooks/useModalA11y';

type HostActions = ReturnType<typeof useOrganisationActivityHostActions>;

type ManageView = 'overview' | 'checkin';

export type HostActivityManageSheetProps = {
  open: boolean;
  activity: ActivityDTO | null;
  tenantId: string | null;
  pendingRequests: ActivityRequestView[];
  actions: HostActions;
  initialView?: ManageView;
  onClose: () => void;
  onRequestsChanged: () => void | Promise<void>;
  onOpenPublicPage?: (activity: ActivityDTO) => void;
  onShare?: (activity: ActivityDTO) => void;
};

/** Full-screen host manage surface (Trips → Hosted). */
export const HostActivityManageSheet = ({
  open,
  activity,
  tenantId,
  pendingRequests,
  actions,
  initialView = 'overview',
  onClose,
  onRequestsChanged,
  onOpenPublicPage,
  onShare,
}: HostActivityManageSheetProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ManageView>(initialView);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [declineRequest, setDeclineRequest] = useState<ActivityRequestView | null>(null);
  const [rideshareNotice, setRideshareNotice] = useState<string | null>(null);
  const [activityRequests, setActivityRequests] = useState<ActivityRequestView[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  useModalA11y(open, onClose, panelRef);

  useEffect(() => {
    if (!open) return;
    setView(initialView);
    setRideshareNotice(null);
  }, [open, initialView, activity?.id]);

  useEffect(() => {
    if (!open || !activity?.id || !tenantId) {
      setActivityRequests([]);
      return;
    }
    setRequestsLoading(true);
    void api
      .getOrganisationJoinRequests(tenantId, { activityId: activity.id })
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

  const menuItems = useMemo(() => {
    if (!activity) return [];
    return buildTripsHostedActivityMenuItems(activity, {
      onOpen: (a) => {
        if (a.status === 'published' && onOpenPublicPage) onOpenPublicPage(a);
        else actions.previewPublished(a.id);
      },
      onShare,
      onEdit: actions.editActivity,
      onDuplicate: actions.reorganizeActivity,
      onCancel: actions.setConfirmCancel,
      onCheckin: () => setView('checkin'),
    });
  }, [activity, actions, onOpenPublicPage, onShare]);

  const handleClose = () => {
    setView('overview');
    setRideshareNotice(null);
    actions.setError(null);
    onClose();
  };

  const toggleCheckInView = () => {
    setView((current) => (current === 'checkin' ? 'overview' : 'checkin'));
  };

  const handleDestructive = () => {
    if (!activity || activity.status !== 'published') return;
    actions.setConfirmCancel(activity);
  };

  const decideRequest = async (
    requestId: string,
    status: 'approved' | 'rejected',
    organizerNote?: string
  ) => {
    if (!tenantId) return;
    setBusyRequestId(requestId);
    try {
      await api.decideOrganisationJoinRequest(tenantId, requestId, status, organizerNote);
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
  const headerTitle = view === 'checkin' ? 'Check in' : title;
  const chatReturnTo = tripsHostedActivityPath(
    activity.id,
    view === 'checkin' ? 'checkin' : 'overview'
  );

  return (
    <>
      <div className="fixed inset-0 z-[1500] flex flex-col bg-neutral-50">
        <header className="shrink-0 border-b border-neutral-200/80 bg-white pt-safe-plus-2">
          <div className="flex items-center gap-2 px-3 pb-2">
            <button
              type="button"
              onClick={handleClose}
              className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-neutral-600 active:bg-neutral-100"
            >
              Close
            </button>
            <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-semibold text-neutral-900">
              {headerTitle}
            </h1>
            <div className="flex w-[4.5rem] shrink-0 justify-end">
              <ActivityActionsMenu items={menuItems} align="right" />
            </div>
          </div>

          <HostActivityManageTopActions
            activity={activity}
            caps={caps}
            view={view}
            busy={actions.busy}
            onChat={async () => {
              const opened = await actions.openGroupChat(activity.id, activity.groupChatId, {
                returnTo: chatReturnTo,
              });
              if (opened) handleClose();
            }}
            onCheckIn={toggleCheckInView}
            onDestructive={handleDestructive}
          />
        </header>

        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={headerTitle}
          className="min-h-0 flex-1 overflow-y-auto scroll-touch px-4 py-4 pb-safe-plus-4"
        >
          {actions.error ? (
            <p className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {actions.error}
            </p>
          ) : null}

          {view === 'checkin' ? (
            <>
              <p className="mb-4 text-sm leading-relaxed text-neutral-600">
                Confirm who attended in person. Checked-in joiners can leave reviews and it counts toward their goals.
              </p>
              <OrganisationActivityCheckInPanel
                tenantId={tenantId}
                activityId={activity.id}
                activityTitle={title}
                onError={(message) => actions.setError(message)}
              />
            </>
          ) : (
            <div className="mx-auto w-full max-w-2xl space-y-5">
              <HostActivityDetailView activity={activity} />

              {activity.status === 'published' ? (
                <ActivityInviteSharePanel
                  activity={{
                    id: activity.id,
                    title,
                    activityType: activity.activityType,
                    date: activity.date,
                    locationName: activity.locationName,
                  }}
                  canSendBuddyInvites
                  compact
                />
              ) : null}

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
                      <OrganisationJoinRequestCard
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

              {caps.showLinkRideshare ? (
                <section className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
                  {rideshareNotice ? (
                    <p className="mb-2 text-sm font-medium text-emerald-700">{rideshareNotice}</p>
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
                </section>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <OrganisationJoinRequestDeclineDialog
        open={Boolean(declineRequest)}
        request={declineRequest}
        submitting={Boolean(declineRequest && busyRequestId === declineRequest.id)}
        onClose={() => setDeclineRequest(null)}
        onConfirm={(organizerNote) => {
          if (!declineRequest) return;
          return decideRequest(declineRequest.id, 'rejected', organizerNote);
        }}
      />

      <OrganisationActivityHostConfirmDialogs actions={actions} onAfterConfirm={handleClose} />
    </>
  );
};
