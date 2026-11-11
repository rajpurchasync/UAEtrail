import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { LinkRidesharePanel } from '../../explore/ui/LinkRidesharePanel';
import { activityManageCapabilities } from '../../activity/activityManageCapabilities';
import { HostActivityManageCancelDialogs } from './HostActivityManageCancelDialogs';
import { fetchPublicActivityDetail } from '../../hooks/usePublicActivityDetail';
import { resolveActivityTitle } from '../../utils/activityIdentity';
import { buildActivitySharePayload } from '../../utils/activityShare';
import { ActivityInviteModalBody } from './ActivityInviteModalBody';
import type { HostActivityManageActions } from '../../hooks/useHostActivityManageActions';
import type {
  ActivityDetailDTO,
  ActivityPresentationDTO,
  ActivityViewerAccessDTO,
  ActivityViewerEntitlementsDTO,
} from '@uaetrail/shared-types';
import { resolveActivityDetailWirePresentation } from '../../activity/resolveActivityDetailWirePresentation';
import { ActivityDetailView } from './ActivityDetailView';
import { CONSUMER_MAIN_OVERLAY_INSET } from '../../config/consumerOverlayInset';
import { HostActivityManageFooterActions } from './HostActivityManageFooterActions';
import { HostActivityManageOptionsSheet } from './HostActivityManageOptionsSheet';
import {
  activityManageSubviewTitle,
  normalizeActivityManageView,
  type ActivityManageInitialView,
  type ActivityManageSubview,
} from './activityManageViews';
import { useModalA11y } from '../../hooks/useModalA11y';
import { useAuth } from '../../context/AuthContext';
import {
  MOBILE_PRODUCT_HEADER_FROSTED,
  MOBILE_PRODUCT_HEADER_REST,
} from '../../config/consumerScrollChrome';
import { useDetailScrollChrome } from '../mobile/useDetailScrollChrome';
import { resolveActivityDetailHeaderChrome } from '../../activity/activityDetailHeaderChrome';
import { ConsumerHeaderActions } from '../layout/ConsumerHeaderActions';
import { DetailHeaderTypeMark } from '../mobile/DetailHeaderChrome';
import { MobileBackButton } from '../mobile/MobileBackButton';
import { CreateHostingActivityFlow } from '../../explore/ui/CreateHostingActivityFlow';
import { hostingFlowForComposeKind } from '../../explore/ui/hostingFlows';
import { resolveHostComposeKindFromActivity } from '../../explore/ui/hostingFromActivity';
import { activityCrewPath, joinAuthPath } from '../../config/routingCatalog';
import { planHostedActivityManagePath } from '../../plan/planRouting';

export type ActivityManageSheetProps = {
  open: boolean;
  activity: ActivityDTO | null;
  tenantId: string | null;
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
  actions,
  initialView = 'overview',
  onClose,
  onRequestsChanged,
  onShare,
}: ActivityManageSheetProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const { headerFrosted } = useDetailScrollChrome(panelRef, scrollContentRef);
  const [view, setView] = useState<ActivityManageSubview>('overview');
  const [manageOptionsOpen, setManageOptionsOpen] = useState(false);
  const [returnToManageMenu, setReturnToManageMenu] = useState(false);
  const [editWizardOpen, setEditWizardOpen] = useState(false);
  const [rideshareNotice, setRideshareNotice] = useState<string | null>(null);
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
    if (!open || !activity?.id) return;
    if (normalizeActivityManageView(initialView) !== 'participants') return;
    navigate(activityCrewPath(activity.id));
    onClose();
  }, [open, initialView, activity?.id, navigate, onClose]);

  useEffect(() => {
    if (!open) return;
    const next = normalizeActivityManageView(initialView);
    if (next === 'participants') return;
    setView(next);
    setRideshareNotice(null);
    setManageOptionsOpen(false);
    setReturnToManageMenu(false);
    setEditWizardOpen(false);
  }, [open, initialView, activity?.id]);

  const caps = activity
    ? activityManageCapabilities(activity, {
        canAddLinkedRide: viewerEntitlements?.canAddLinkedRide ?? false,
      })
    : null;

  const handleClose = () => {
    setView('overview');
    setRideshareNotice(null);
    setManageOptionsOpen(false);
    setReturnToManageMenu(false);
    actions.setError(null);
    onClose();
  };

  const handleHeaderBack = () => {
    if (view === 'overview') {
      handleClose();
      return;
    }
    actions.setError(null);
    if (returnToManageMenu) {
      setView('overview');
      setManageOptionsOpen(true);
      setReturnToManageMenu(false);
      return;
    }
    setView('overview');
  };

  const openManageSubviewFromMenu = (subview: ActivityManageSubview) => {
    if (subview === 'participants') {
      if (!activity) return;
      navigate(activityCrewPath(activity.id));
      handleClose();
      return;
    }
    setReturnToManageMenu(true);
    setView(subview);
    setManageOptionsOpen(false);
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

  if (!open || !activity || !tenantId || !caps) return null;

  const title = resolveActivityTitle(activity);
  const headerTitle = activityManageSubviewTitle(view, title);
  const chatReturnTo = planHostedActivityManagePath(activity.id);
  const sharePayload = buildActivitySharePayload({
    id: activity.id,
    title,
    activityType: activity.activityType,
    date: activity.date,
    locationName: activity.locationName,
  });
  const showShareFooter = activity.status === 'published' && Boolean(onShare);
  const typeChrome = resolveActivityDetailHeaderChrome(activity, null);

  return (
    <>
      <div className={`${CONSUMER_MAIN_OVERLAY_INSET} z-[1500] flex flex-col bg-neutral-50`}>
        <header
          className={`pointer-events-none fixed inset-x-0 top-0 z-20 pt-safe-plus-2 ${
            headerFrosted ? MOBILE_PRODUCT_HEADER_FROSTED : MOBILE_PRODUCT_HEADER_REST
          }`}
        >
          <div className="pointer-events-auto grid grid-cols-[minmax(72px,auto)_1fr_auto] items-center gap-2 px-3 pb-2">
            <MobileBackButton
              onPress={handleHeaderBack}
              label="Back"
              className="min-h-[36px] py-0 -ml-1"
            />
            <div className="flex min-w-0 items-center justify-center gap-2 px-1">
              <DetailHeaderTypeMark
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
          role="dialog"
          aria-modal="true"
          aria-label={headerTitle}
          className="min-h-0 flex-1 overflow-y-auto scroll-touch px-4 pb-4 pt-[calc(var(--safe-top)+3.5rem)]"
        >
          <div ref={scrollContentRef} className="py-4">
          {actions.error ? (
            <p className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {actions.error}
            </p>
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
            <div className="mx-auto w-full max-w-2xl">
              <ActivityDetailView
                layout="embedded"
                activity={{ ...(sheetActivity as ActivityDetailDTO), location: taggedPlace ?? (sheetActivity as ActivityDetailDTO).location }}
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
                wireSections={embeddedWirePresentation?.sections ?? null}
              />
            </div>
          ) : null}
          </div>
        </div>

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
          onManage={() => setManageOptionsOpen(true)}
        />
      </div>

      <HostActivityManageOptionsSheet
        open={manageOptionsOpen}
        onClose={() => setManageOptionsOpen(false)}
        activity={activity}
        caps={caps}
        onSelectSubview={openManageSubviewFromMenu}
        onEdit={() => {
          setManageOptionsOpen(false);
          setReturnToManageMenu(true);
          setEditWizardOpen(true);
        }}
        onDuplicate={() => actions.hostFromExistingActivity(activity)}
        onDelete={handleDelete}
      />

      <HostActivityManageCancelDialogs actions={actions} onAfterConfirm={handleClose} />

      {activity ? (
        <CreateHostingActivityFlow
          open={editWizardOpen}
          editActivity={activity}
          hostingKindFlow={hostingFlowForComposeKind(resolveHostComposeKindFromActivity(activity))}
          hostComposeKind={resolveHostComposeKindFromActivity(activity)}
          signInHref={joinAuthPath(planHostedActivityManagePath(activity.id))}
          onClose={() => setEditWizardOpen(false)}
          onPublished={async (updated) => {
            setSheetActivity(updated);
            setEditWizardOpen(false);
            await onRequestsChanged();
          }}
        />
      ) : null}
    </>
  );
};
