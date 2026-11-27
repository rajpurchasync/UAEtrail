import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { afterHostJoinDecisionClientRefresh } from '../../hooks/activityJoinClientEffects';
import {
  activityCatalogAllows,
  isPublishedActivityStatus,
  resolveActivityCatalogRemoveKind,
  type ActivityDetailDTO,
  type ActivityDTO,
  type ActivityPresentationDTO,
  type ActivityViewerAccessDTO,
  type ActivityViewerEntitlementsDTO,
} from '@uaetrail/shared-types';
import { LinkRidesharePanel } from '@/discovery/discoveryPortExploreHosting';
import { activityManageCapabilities } from '../../activity/activityManageCapabilities';
import { ActivityJoinRequestDeclineDialog } from '../../operator/desk/ActivityJoinRequestDeclineDialog';
import { ActivityRollcallView } from './ActivityRollcallView';
import { HostActivityManageCancelDialogs } from './HostActivityManageCancelDialogs';
import type { ActivityRequestView } from '../../hooks/publishingJoinQueueClientApi';
import {
  decideActivityJoinRequest,
  getActivityJoinRequests,
} from '../../hooks/publishingJoinQueueClientApi';
import { fetchPublicActivityDetail } from '../../hooks/usePublicActivityDetail';
import { resolveActivityTitle } from '../../utils/activityIdentity';
import { buildActivitySharePayload } from '../../utils/activityShare';
import { ActivityInviteModalBody } from './ActivityInviteModalBody';
import type { HostActivityManageActions } from '../../hooks/useHostActivityManageActions';
import { resolveActivityDetailWirePresentation } from '../../activity/resolveActivityDetailWirePresentation';
import { ActivityDetailByKind } from '../../activity/detail/templates/ActivityDetailByKind';
import { CONSUMER_MAIN_OVERLAY_INSET } from '../../config/consumerOverlayInset';
import { HostActivityManageFooterActions } from './HostActivityManageFooterActions';
import { HostActivityManageOptionsSheet } from './HostActivityManageOptionsSheet';
import {
  activityManageSubviewTitle,
  normalizeActivityManageView,
  type ActivityManageInitialView,
  type ActivityManageSubview,
} from './activityManageViews';
import {
  activityManageSheetChromeClosed,
  activityManageSheetCloseEdit,
  activityManageSheetCloseOptions,
  activityManageSheetHeaderBack,
  activityManageSheetOpenEdit,
  activityManageSheetOpenOptions,
  activityManageSheetSelectSubview,
  activityManageSheetSelectSubviewFromMenu,
  type ActivityManageSheetChrome,
} from './activityManageSheetChrome';
import { useModalA11y } from '../../hooks/useModalA11y';
import { useAuth } from '../../context/AuthContext';
import {
  MOBILE_PRODUCT_HEADER_FROSTED,
  MOBILE_PRODUCT_HEADER_REST,
} from '../../config/consumerScrollChrome';
import { useDetailScrollChrome } from '../mobile/useDetailScrollChrome';
import { resolveActivityDetailHeaderChrome } from '../../activity/activityDetailHeaderChrome';
import { ConsumerHeaderActions } from '../layout/ConsumerHeaderActions';
import { ConsumerDetailHeaderTypeMark } from '../mobile/DetailHeaderChrome';
import { MobileBackButton } from '../mobile/MobileBackButton';
import {
  CreateHostingActivityFlow,
  hostingFlowForComposeKind,
  resolveHostComposeKindFromActivity,
} from '@/discovery/discoveryPortExploreHosting';
import { activityCrewPath, joinAuthPath } from '../../config/routingCatalog';
import { planHostedActivityManagePath } from '../../plan/planRouting';

export type ActivityManageSheetProps = {
  open: boolean;
  activity: ActivityDTO | null;
  tenantId: string | null;
  pendingRequests: ActivityRequestView[];
  actions: HostActivityManageActions;
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
  onShare,
}: ActivityManageSheetProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const headerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const { headerFrosted } = useDetailScrollChrome(panelRef, scrollContentRef);
  const [chrome, setChrome] = useState<ActivityManageSheetChrome>(() =>
    activityManageSheetChromeClosed('overview')
  );
  const view = chrome.view;
  const manageOptionsOpen = chrome.optionsOpen;
  const editWizardOpen = chrome.editOpen;

  /** Manage header is outside scroll; keep `--detail-header-pad` at 0 so jump-nav sticky stays flush. */
  useLayoutEffect(() => {
    const scroll = panelRef.current;
    if (!scroll) return;
    scroll.style.setProperty('--detail-header-pad', '0px');
  }, [open]);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [declineRequest, setDeclineRequest] = useState<ActivityRequestView | null>(null);
  const [rideshareNotice, setRideshareNotice] = useState<string | null>(null);
  const [activityRequests, setActivityRequests] = useState<ActivityRequestView[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [sheetActivity, setSheetActivity] = useState<ActivityDTO | null>(activity);
  const [taggedPlace, setTaggedPlace] = useState<ActivityDetailDTO['location']>(undefined);
  const [viewerEntitlements, setViewerEntitlements] = useState<ActivityViewerEntitlementsDTO | null>(null);
  const [wirePresentation, setWirePresentation] = useState<ActivityPresentationDTO | null>(null);

  useEffect(() => {
    setSheetActivity(activity);
    setTaggedPlace(undefined);
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
        setTaggedPlace(res.activity.location);
        setSheetActivity((prev) => {
          if (!prev || prev.id !== res.activity.id) return prev;
          return {
            ...prev,
            locationId: prev.locationId?.trim() ? prev.locationId : res.activity.locationId,
            locationName: prev.locationName?.trim() ? prev.locationName : res.activity.locationName,
          };
        });
      })
      .catch(() => {
        setViewerEntitlements(null);
        setWirePresentation(null);
      });
  }, [open, activity?.id]);

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
      isEmbedded: false,
      joinUiState: { kind: 'open' },
    });
  }, [wirePresentation, sheetActivity, viewerEntitlements]);

  useEffect(() => {
    if (!open || !activity?.id) return;
    if (normalizeActivityManageView(initialView) !== 'participants') return;
    navigate(activityCrewPath(activity.id));
    onClose();
  }, [open, initialView, activity?.id, navigate, onClose]);

  useEffect(() => {
    if (!open) return;
    const next = normalizeActivityManageView(initialView);
    if (next === 'participants') return;
    setChrome(activityManageSheetChromeClosed(next));
    setRideshareNotice(null);
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
    setChrome(activityManageSheetChromeClosed());
    setRideshareNotice(null);
    actions.setError(null);
    onClose();
  };

  const handleHeaderBack = () => {
    actions.setError(null);
    const next = activityManageSheetHeaderBack(chrome);
    if (next === 'close') {
      handleClose();
      return;
    }
    setChrome(next);
  };

  const manageSheetActive = Boolean(open && activity && tenantId && caps);

  useModalA11y(
    manageSheetActive,
    () => {
      if (view !== 'overview') {
        handleHeaderBack();
        return;
      }
      handleClose();
    },
    panelRef
  );

  const openManageSubviewFromMenu = (subview: ActivityManageSubview) => {
    if (subview === 'participants') {
      if (!activity) return;
      navigate(activityCrewPath(activity.id));
      handleClose();
      return;
    }
    setChrome(activityManageSheetSelectSubviewFromMenu(subview));
  };

  const handleDelete = () => {
    if (!activity) return;
    const removeKind = resolveActivityCatalogRemoveKind(activity.status);
    if (removeKind === 'delete_draft' || (removeKind === 'cancel' && !isPublishedActivityStatus(activity.status))) {
      actions.setConfirmDelete(activity);
      return;
    }
    if (removeKind === 'cancel') {
      actions.setConfirmCancel(activity);
    }
  };

  const handleSuspend = () => {
    if (!activity || !activityCatalogAllows(activity.status, 'suspend')) return;
    actions.setConfirmSuspend(activity);
  };

  const handleResume = () => {
    if (!activity || !activityCatalogAllows(activity.status, 'resume')) return;
    void actions.resumeActivity(activity);
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
  const sharePayload = buildActivitySharePayload({
    id: activity.id,
    title,
    activityType: activity.activityType,
    date: activity.date,
    locationName: activity.locationName,
  });
  const showShareFooter = isPublishedActivityStatus(activity.status) && Boolean(onShare);
  const typeChrome = resolveActivityDetailHeaderChrome(activity, null);

  return (
    <>
      <div
        className={`${CONSUMER_MAIN_OVERLAY_INSET} z-[1500] flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-neutral-50`}
      >
        <header
          ref={headerRef}
          className={`relative z-20 shrink-0 pt-safe-plus-2 ${
            headerFrosted ? MOBILE_PRODUCT_HEADER_FROSTED : MOBILE_PRODUCT_HEADER_REST
          }`}
        >
          <div className="grid grid-cols-[minmax(72px,auto)_1fr_auto] items-center gap-2 px-3 pb-2">
            <MobileBackButton
              onPress={handleHeaderBack}
              label="Back"
              className="min-h-[36px] py-0 -ml-1"
            />
            <div className="flex min-w-0 items-center justify-center gap-2 px-1">
              <ConsumerDetailHeaderTypeMark
                emoji={typeChrome.emoji}
                mark={typeChrome.mark}
                sizeClass="h-8 w-8"
              />
              <h1 className="min-w-0 truncate text-center text-[15px] font-semibold leading-tight text-neutral-900">
                {headerTitle}
              </h1>
            </div>
            <ConsumerHeaderActions showOnDesktop={false} />
          </div>
        </header>

        <div
          ref={panelRef}
          data-entity-detail-scroll
          role="dialog"
          aria-modal="true"
          aria-label={headerTitle}
          className="min-h-0 flex-1 overflow-y-auto scroll-touch px-4 pb-4"
        >
          <div ref={scrollContentRef} className="py-4">
          {actions.error ? (
            <p className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {actions.error}
            </p>
          ) : null}

          {view === 'participants' ? (
            <div className="mx-auto w-full max-w-2xl">
              <ActivityRollcallView
                tenantId={tenantId}
                activityId={activity.id}
                pendingRequests={activityRequests}
                busyRequestId={busyRequestId}
                onParticipantsError={(message) => actions.setError(message)}
                onApproveJoinRequest={(requestId) => void decideRequest(requestId, 'approved')}
                onRejectJoinRequest={(request) => setDeclineRequest(request)}
                className="min-h-[min(60dvh,28rem)]"
              />
            </div>
          ) : null}

          {view === 'invite' ? (
            <div className="mx-auto w-full max-w-md">
              <ActivityInviteModalBody
                activityId={activity.id}
                messageWithUrl={sharePayload.messageWithUrl}
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
            <div className="min-w-0 w-full">
              <ActivityDetailByKind
                layout="page"
                activity={{
                  ...(sheetActivity as ActivityDetailDTO),
                  location: taggedPlace ?? (sheetActivity as ActivityDetailDTO).location,
                }}
                canAccessCrewSurfaces
                viewerAccess={
                  embeddedWirePresentation
                    ? {
                        exposure: 'full',
                        level: 'host',
                        gateReason: null,
                        canViewFullActivity: true,
                        canOpenDetailPage: true,
                        joinMode: sheetActivity.joinMode ?? 'open',
                        canAccessCrewSurfaces: true,
                        entitlements: viewerEntitlements ?? undefined,
                      }
                    : null
                }
                viewerEntitlements={viewerEntitlements}
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
                hostCrewHub={{
                  joinRequests: activityRequests,
                  requestsLoading,
                  onRequestsChanged,
                }}
                wireFooterByTab={embeddedWirePresentation?.footerByTab ?? null}
                wireSections={embeddedWirePresentation?.sections ?? null}
                wireStrips={embeddedWirePresentation?.strips ?? null}
                linkRideshareTenantId={tenantId}
                onHostShareOuting={showShareFooter && onShare ? () => onShare(activity) : undefined}
                hostManageSurface={{
                  activity,
                  caps,
                  tenantId,
                  busy: actions.busy,
                  joinRequests: activityRequests,
                  requestsLoading,
                  busyRequestId,
                  onParticipantsError: (message) => actions.setError(message),
                  onApproveJoinRequest: (requestId) => void decideRequest(requestId, 'approved'),
                  onRejectJoinRequest: (request) => setDeclineRequest(request),
                  onSelectSubview: (subview) => {
                    setChrome(activityManageSheetSelectSubview(subview, false));
                  },
                  onEdit: () => {
                    setChrome(activityManageSheetOpenEdit(true));
                  },
                  onDuplicate: () => actions.hostFromExistingActivity(activity),
                  onDelete: handleDelete,
                  onSuspend: handleSuspend,
                  onResume: handleResume,
                  onShare: showShareFooter && onShare ? () => onShare(activity) : undefined,
                  onChat: caps.showGroupChat
                    ? () => {
                        void actions
                          .openGroupChat(activity.id, activity.groupChatId, { returnTo: chatReturnTo })
                          .then((opened) => {
                            if (opened) handleClose();
                          });
                      }
                    : undefined,
                }}
              />
            </div>
          ) : null}
          </div>
        </div>

        <div className="shrink-0">
          <HostActivityManageFooterActions
            caps={caps}
            busy={actions.busy}
            showShare={showShareFooter}
            onOpenShare={onShare ? () => onShare(activity) : undefined}
            onChat={async () => {
              const opened = await actions.openGroupChat(activity.id, activity.groupChatId, {
                returnTo: chatReturnTo,
              });
              if (opened) handleClose();
            }}
            onManage={() => setChrome((current) => activityManageSheetOpenOptions(current))}
          />
        </div>
      </div>

      <HostActivityManageOptionsSheet
        open={manageOptionsOpen}
        onClose={() => setChrome((current) => activityManageSheetCloseOptions(current))}
        activity={activity}
        caps={caps}
        onSelectSubview={openManageSubviewFromMenu}
        onEdit={() => {
          setChrome(activityManageSheetOpenEdit(true));
        }}
        onDuplicate={() => actions.hostFromExistingActivity(activity)}
        onDelete={handleDelete}
        onSuspend={handleSuspend}
        onResume={handleResume}
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

      {activity ? (
        <CreateHostingActivityFlow
          open={editWizardOpen}
          editActivity={activity}
          hostingKindFlow={hostingFlowForComposeKind(resolveHostComposeKindFromActivity(activity))}
          hostComposeKind={resolveHostComposeKindFromActivity(activity)}
          signInHref={joinAuthPath(planHostedActivityManagePath(activity.id))}
          onClose={() => setChrome((current) => activityManageSheetCloseEdit(current))}
          onPublished={async (updated) => {
            setSheetActivity(updated);
            setChrome((current) => activityManageSheetCloseEdit(current));
            await onRequestsChanged();
          }}
        />
      ) : null}
    </>
  );
};
