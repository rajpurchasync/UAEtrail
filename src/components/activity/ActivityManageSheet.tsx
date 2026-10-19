import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { afterHostJoinDecisionClientRefresh } from '../../hooks/activityJoinClientEffects';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { LinkRidesharePanel } from '../../explore/ui/LinkRidesharePanel';
import { activityManageCapabilities } from '../../activity/activityManageCapabilities';
import { ActivityJoinRequestCard } from '../../console/ActivityJoinRequestCard';
import { ActivityJoinRequestDeclineDialog } from '../../console/ActivityJoinRequestDeclineDialog';
import { ActivityParticipantsPanel } from './ActivityParticipantsPanel';
import { HostActivityManageCancelDialogs } from './HostActivityManageCancelDialogs';
import {
  decideActivityJoinRequest,
  getActivityJoinRequests,
  type ActivityRequestView,
} from '../../hooks/tenantActivityClientApi';
import { fetchPublicActivityDetail } from '../../hooks/usePublicActivityDetail';
import { resolveActivityTitle } from '../../utils/activityIdentity';
import { buildActivitySharePayload } from '../../utils/activityShare';
import { ActivityInviteModalBody } from './ActivityInviteModalBody';
import type { OperatorActivityManageActions } from '../../hooks/useOperatorActivityManageActions';
import type {
  ActivityDetailDTO,
  ActivityPresentationDTO,
  ActivityViewerAccessDTO,
  ActivityViewerEntitlementsDTO,
} from '@uaetrail/shared-types';
import { resolveActivityDetailWirePresentation } from '../../activity/resolveActivityDetailWirePresentation';
import { ActivityDetailView } from './ActivityDetailView';
import type { ActivityDetailTabId } from '../../activity/activityDetailTab';
import { HostActivityManageFooterActions } from './HostActivityManageFooterActions';
import { HostActivityManageOptionsSheet } from './HostActivityManageOptionsSheet';
import {
  activityManageSubviewTitle,
  normalizeActivityManageView,
  type ActivityManageInitialView,
  type ActivityManageSubview,
} from './activityManageViews';
import { planHostedActivityManagePath } from '../../plan/planRouting';
import { useModalA11y } from '../../hooks/useModalA11y';
import { useAuth } from '../../context/AuthContext';

export type ActivityManageSheetProps = {
  open: boolean;
  activity: ActivityDTO | null;
  tenantId: string | null;
  pendingRequests: ActivityRequestView[];
  actions: OperatorActivityManageActions;
  initialView?: ActivityManageInitialView;
  onClose: () => void;
  onRequestsChanged: () => void | Promise<void>;
  onOpenPublicPage?: (activity: ActivityDTO) => void;
  onShare?: (activity: ActivityDTO) => void;
};

/** Full-screen manage surface for a hosted activity (Trips hosted + operator console). */
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
  const queryClient = useQueryClient();
  const panelRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ActivityManageSubview>('overview');
  const [manageOptionsOpen, setManageOptionsOpen] = useState(false);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [declineRequest, setDeclineRequest] = useState<ActivityRequestView | null>(null);
  const [rideshareNotice, setRideshareNotice] = useState<string | null>(null);
  const [activityRequests, setActivityRequests] = useState<ActivityRequestView[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<ActivityDetailTabId>('plan');
  const [sheetActivity, setSheetActivity] = useState<ActivityDTO | null>(activity);
  const [viewerEntitlements, setViewerEntitlements] = useState<ActivityViewerEntitlementsDTO | null>(null);
  const [wirePresentation, setWirePresentation] = useState<ActivityPresentationDTO | null>(null);

  useEffect(() => {
    setSheetActivity(activity);
  }, [activity]);

  useEffect(() => {
    if (!open || !activity?.id) {
      setViewerEntitlements(null);
      setWirePresentation(null);
      return;
    }
    void fetchPublicActivityDetail(activity.id)
      .then((res) => {
        setViewerEntitlements(res.viewerAccess?.entitlements ?? null);
        setWirePresentation(res.presentation ?? null);
      })
      .catch(() => {
        setViewerEntitlements(null);
        setWirePresentation(null);
      });
  }, [open, activity?.id]);

  useModalA11y(open, onClose, panelRef);

  const embeddedWirePresentation = useMemo(() => {
    if (wirePresentation) return wirePresentation;
    if (!sheetActivity) return null;
    const viewerAccess: ActivityViewerAccessDTO = {
      exposure: 'full',
      level: 'host',
      gateReason: null,
      canViewFullActivity: true,
      canOpenDetailPage: true,
      joinMode: sheetActivity.joinMode ?? 'open',
      canAccessCrewSurfaces: true,
      entitlements: viewerEntitlements ?? undefined,
    };
    return resolveActivityDetailWirePresentation({
      activity: sheetActivity as ActivityDetailDTO,
      viewerAccess,
      isHostUser: true,
      isEmbedded: true,
      joinUiState: { kind: 'open' },
    });
  }, [wirePresentation, sheetActivity, viewerEntitlements]);

  useEffect(() => {
    if (!open) return;
    setView(normalizeActivityManageView(initialView));
    setRideshareNotice(null);
    setManageOptionsOpen(false);
    setDetailTab('plan');
  }, [open, initialView, activity?.id]);

  useEffect(() => {
    if (!open || !activity?.id || !tenantId) {
      setActivityRequests([]);
      return;
    }
    setRequestsLoading(true);
    void getActivityJoinRequests(tenantId, { activityId: activity.id })
      .then((data) => {
        setActivityRequests(data.filter((request) => request.status === 'pending'));
      })
      .catch(() => {
        setActivityRequests(
          pendingRequests.filter((request) => request.activity?.id === activity.id && request.status === 'pending')
        );
      })
      .finally(() => setRequestsLoading(false));
  }, [open, activity?.id, tenantId, pendingRequests]);

  const caps = activity
    ? activityManageCapabilities(activity, {
        canAddLinkedRide: viewerEntitlements?.canAddLinkedRide ?? false,
      })
    : null;

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
    hostNote?: string
  ) => {
    if (!tenantId || !activity) return;
    setBusyRequestId(requestId);
    try {
      await decideActivityJoinRequest(tenantId, requestId, status, hostNote);
      await afterHostJoinDecisionClientRefresh(queryClient, { activityId: activity.id, status });
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
  const headerTitle = activityManageSubviewTitle(view, title);
  const chatReturnTo = planHostedActivityManagePath(
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

          {view === 'overview' && sheetActivity ? (
            <div className="mx-auto w-full max-w-2xl">
              <ActivityDetailView
                layout="embedded"
                activity={sheetActivity as ActivityDetailDTO}
                mobileTab={detailTab}
                onMobileTabChange={setDetailTab}
                canAccessCrewSurfaces
                hostCrewChatPolicy={
                  tenantId
                    ? {
                        tenantId,
                        onSaved: (policy) =>
                          setSheetActivity((prev) => (prev ? { ...prev, groupChatPostPolicy: policy } : prev)),
                        onError: (message) => actions.setError(message),
                      }
                    : undefined
                }
                wireFooterByTab={embeddedWirePresentation?.footerByTab ?? null}
                wireTabs={embeddedWirePresentation?.tabs ?? null}
              />
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
        onDuplicate={() => actions.hostFromExistingActivity(activity)}
        onDelete={handleDelete}
      />

      <ActivityJoinRequestDeclineDialog
        open={Boolean(declineRequest)}
        request={declineRequest}
        submitting={Boolean(declineRequest && busyRequestId === declineRequest.id)}
        onClose={() => setDeclineRequest(null)}
        onConfirm={(hostNote) => {
          if (!declineRequest) return;
          return decideRequest(declineRequest.id, 'rejected', hostNote);
        }}
      />

      <HostActivityManageCancelDialogs actions={actions} onAfterConfirm={handleClose} />
    </>
  );
};
