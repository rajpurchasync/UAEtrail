import type { ActivityDTO } from '@uaetrail/shared-types';
import { HostActivityCancelDialog } from '../../components/activity/HostActivityCancelDialog';
import { addVenueKindFromRoute } from '../compose';
import { clearComposeWizardSessionForRoute } from '../ui/composeWizardSession';
import { ComposeHost } from '../create/ComposeHost';
import { GuestComposeSignInSheet } from '../ui/GuestComposeSignInSheet';
import { ExploreJoinOverlays } from '../ui/ExploreJoinOverlays';
import type { HostingWizardPrefill } from '../ui/hostingWizardPrefill';
import type { useComposeRoute } from '../create/hooks/useComposeRoute';
import type { ReactNode } from 'react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { useExploreSelectionActions } from '../ui/useExploreSelectionActions';

type ComposeState = ReturnType<typeof useComposeRoute>;
type SelectionState = ReturnType<typeof useExploreSelectionActions>;

type Props = {
  compose: ComposeState;
  selection: SelectionState;
  user: { id: string } | null | undefined;
  hostWizardOpen: boolean;
  hostingWizardPrefill: HostingWizardPrefill | null;
  pathname: string;
  search: string;
  signInHref: string;
  planWithBuddyUserId: string | null;
  composeAreaSlug: string | null;
  hostRemoveParticipantNotice: string | null;
  rideshareLinkParent: ActivityDTO | null;
  rideshareLinkSeeking: ExploreMapItemDTO | null;
  onCloseCreateFlow: () => void;
  onHostingBackToIntent: () => void;
  onActivityPublished: (activity: ActivityDTO) => Promise<void>;
  onCreateLinkedRideshare: (parent: ActivityDTO) => void;
  onOpenHostApplication: () => void;
  onRefreshHostGate: () => void;
  setRideshareLinkParent: (value: ActivityDTO | null) => void;
  setRideshareLinkSeeking: (value: ExploreMapItemDTO | null) => void;
  hostManageSheet: ReactNode;
  tenantId: string | null;
  useDesktopGuestGatePanel: boolean;
};

/** Compose wizards, join overlays, host dialogs (R2). Map search lives on {@link ExploreMapStage}. */
export const ExploreExperienceOverlays = ({
  compose,
  selection,
  user,
  hostWizardOpen,
  hostingWizardPrefill,
  signInHref,
  planWithBuddyUserId,
  composeAreaSlug,
  hostRemoveParticipantNotice,
  rideshareLinkParent,
  rideshareLinkSeeking,
  onCloseCreateFlow,
  onHostingBackToIntent,
  onActivityPublished,
  onCreateLinkedRideshare,
  onOpenHostApplication,
  onRefreshHostGate,
  setRideshareLinkParent,
  setRideshareLinkSeeking,
  hostManageSheet,
  tenantId,
  useDesktopGuestGatePanel,
}: Props) => (
  <>
    {hostManageSheet}

    <ComposeHost
      composeRoute={compose.composeRoute}
      composeMenuOpen={compose.composeMenuOpen}
      hostWizardOpen={hostWizardOpen}
      seekFixedWizardOpen={Boolean(compose.seekFixedRoute) && Boolean(user)}
      addWizardOpen={Boolean(compose.addRoute) && Boolean(user)}
      seekFlexibleOpen={compose.seekFlexibleOpen && Boolean(user)}
      hostComposeKind={compose.hostComposeRoute?.kind ?? null}
      seekFixedKind={compose.seekFixedRoute?.kind}
      addVenueKind={addVenueKindFromRoute(compose.addRoute)}
      hostingWizardPrefill={hostingWizardPrefill}
      signInHref={signInHref}
      onComposeRouteChange={compose.handleComposeRouteChange}
      onCloseCompose={compose.closeCompose}
      onCloseCreateFlow={onCloseCreateFlow}
      onHostingBackToIntent={onHostingBackToIntent}
      wizardEnteredFromMenu={compose.wizardEnteredFromMenu}
      onSeekingBackToIntent={() => {
        clearComposeWizardSessionForRoute(compose.seekFixedRoute);
        compose.setComposeRoute({ surface: 'menu', intent: 'seek' });
      }}
      onAddBackToIntent={() => {
        clearComposeWizardSessionForRoute(compose.addRoute);
        compose.setComposeRoute({ surface: 'menu', intent: 'add' });
      }}
      onActivityPublished={async (activity) => {
        await onActivityPublished(activity);
        if (rideshareLinkParent && activity.activityType === 'rideshare') {
          setRideshareLinkParent(null);
        }
        if (rideshareLinkSeeking && activity.activityType === 'rideshare') {
          setRideshareLinkSeeking(null);
        }
        void onRefreshHostGate();
      }}
      onSeekingSubmitted={(result) => {
        selection.handleSeekingSubmitted(result);
        void onRefreshHostGate();
      }}
      onCreateLinkedRideshare={onCreateLinkedRideshare}
      tenantId={tenantId}
      planWithBuddyUserId={planWithBuddyUserId}
      composeAreaSlug={composeAreaSlug}
      onOpenHostApplication={onOpenHostApplication}
      onAddSubmitted={selection.handleAddSubmitted}
    />

    <HostActivityCancelDialog
      activity={selection.hostRemoveConfirm}
      participantNotice={hostRemoveParticipantNotice}
      busy={selection.hostRemoveBusy}
      onClose={() => selection.setHostRemoveConfirm(null)}
      onConfirm={() => void selection.confirmHostRemove()}
    />

    <ExploreJoinOverlays
      activity={selection.selected?.activity}
      exploreMapItemId={selection.selected?.id}
      joinActions={selection.joinActions}
      onJoinSuccess={selection.handlePeekJoinSuccess}
      useDesktopGuestGatePanel={useDesktopGuestGatePanel}
    />

    {!useDesktopGuestGatePanel ? (
    <GuestComposeSignInSheet
      open={compose.guestComposeSignInOpen}
      onClose={compose.closeGuestComposeSignIn}
      authReturnPath={compose.guestComposeSignInReturnPath}
    />
    ) : null}
  </>
);
