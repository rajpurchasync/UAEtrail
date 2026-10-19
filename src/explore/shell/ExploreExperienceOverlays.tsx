import type { ActivityDTO } from '@uaetrail/shared-types';
import { HostActivityCancelDialog } from '../../components/activity/HostActivityCancelDialog';
import { AppButton } from '../../components/mobile/AppButton';
import { Dialog } from '../../components/ui/Dialog';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { addVenueKindFromRoute } from '../compose';
import { ExploreBrowseSearchModal } from '../ui/ExploreBrowseSearchModal';
import { ComposeHost } from '../create/ComposeHost';
import { ExploreGuestSignInCard } from '../ui/ExploreGuestSignInCard';
import { ExploreJoinOverlays } from '../ui/ExploreJoinOverlays';
import { ExploreResponsiveSheet } from '../ui/ExploreResponsiveSheet';
import type { HostingWizardPrefill } from '../ui/hostingWizardPrefill';
import type { useComposeRoute } from '../create/hooks/useComposeRoute';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import type { ReactNode } from 'react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { AreaPublicDTO } from '@uaetrail/shared-types';
import type { useExploreSelectionActions } from '../ui/useExploreSelectionActions';

type ComposeState = ReturnType<typeof useComposeRoute>;
type SelectionState = ReturnType<typeof useExploreSelectionActions>;

type Props = {
  compose: ComposeState;
  selection: SelectionState;
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
  exploreSearchModalOpen: boolean;
  onCloseExploreSearchModal: () => void;
  browseQuery: string;
  onBrowseQueryChange: (q: string) => void;
  onExploreSearchCommit: (scope?: ExploreSearchScopeKey | null) => void;
  searchScopeCounts: ExploreSearchScopeCounts;
  publishedAreas: AreaPublicDTO[];
  onPickExploreArea: (slug: string) => void;
  inviteShareSheet: ReactNode;
  hostManageSheet: ReactNode;
  tenantId: string | null;
};

/** Compose wizards, join overlays, host dialogs, search modal (R2). */
export const ExploreExperienceOverlays = ({
  compose,
  selection,
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
  exploreSearchModalOpen,
  onCloseExploreSearchModal,
  browseQuery,
  onBrowseQueryChange,
  onExploreSearchCommit,
  searchScopeCounts,
  publishedAreas,
  onPickExploreArea,
  inviteShareSheet,
  hostManageSheet,
  tenantId,
}: Props) => (
  <>
    {inviteShareSheet}
    {hostManageSheet}

    <ComposeHost
      composeRoute={compose.composeRoute}
      composeMenuOpen={compose.composeMenuOpen}
      hostWizardOpen={hostWizardOpen}
      seekFixedWizardOpen={Boolean(compose.seekFixedRoute)}
      addWizardOpen={Boolean(compose.addRoute)}
      seekFlexibleOpen={compose.seekFlexibleOpen}
      hostComposeKind={compose.hostComposeRoute?.kind ?? null}
      seekFixedKind={compose.seekFixedRoute?.kind}
      addVenueKind={addVenueKindFromRoute(compose.addRoute)}
      hostingWizardPrefill={hostingWizardPrefill}
      signInHref={signInHref}
      onComposeRouteChange={compose.handleComposeRouteChange}
      onCloseCompose={compose.closeCompose}
      onCloseCreateFlow={onCloseCreateFlow}
      onHostingBackToIntent={onHostingBackToIntent}
      onSeekingBackToIntent={() => compose.setComposeRoute({ surface: 'menu', intent: 'seek' })}
      onAddBackToIntent={() => compose.setComposeRoute({ surface: 'menu', intent: 'add' })}
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
    />

    <ExploreBrowseSearchModal
      open={exploreSearchModalOpen}
      onClose={onCloseExploreSearchModal}
      query={browseQuery}
      onQueryChange={onBrowseQueryChange}
      onCommit={onExploreSearchCommit}
      scopeCounts={searchScopeCounts}
      publishedAreas={publishedAreas}
      onPickArea={onPickExploreArea}
    />

    <ExploreResponsiveSheet
      open={compose.guestComposeSignInOpen}
      onClose={compose.closeGuestComposeSignIn}
      maxWidthClass="max-w-md"
      zClass={EXPLORE_Z.guestJoinSheet}
      overlayFixed
      layout="centered"
      showCloseButton
      showHandle={false}
      ariaLabel="Sign in to continue"
    >
      <div className="px-4 pb-5 pt-8 sm:px-6 sm:pb-6">
        <ExploreGuestSignInCard intent="peek-details" compact />
        <button
          type="button"
          onClick={compose.closeGuestComposeSignIn}
          className="mt-2 block w-full py-2 text-center text-sm font-medium text-neutral-400"
        >
          Keep browsing
        </button>
      </div>
    </ExploreResponsiveSheet>
  </>
);
