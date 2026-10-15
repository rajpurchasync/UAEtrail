import type { ActivityDTO } from '@uaetrail/shared-types';
import { HostActivityCancelDialog } from '../../components/activity/HostActivityCancelDialog';
import { AppButton } from '../../components/mobile/AppButton';
import { Dialog } from '../../components/ui/Dialog';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { ExploreBrowseSearchModal } from '../ui/ExploreBrowseSearchModal';
import { ExploreComposeHost } from '../ui/ExploreComposeHost';
import { ExploreGuestSignInCard } from '../ui/ExploreGuestSignInCard';
import { ExploreJoinOverlays } from '../ui/ExploreJoinOverlays';
import { ExploreResponsiveSheet } from '../ui/ExploreResponsiveSheet';
import type { OrganizeWizardPrefill } from '../ui/organizeWizardPrefill';
import type { useExploreComposeRoute } from '../ui/useExploreComposeRoute';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import type { ReactNode } from 'react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { AreaPublicDTO } from '@uaetrail/shared-types';
import type { useExploreSelectionActions } from '../ui/useExploreSelectionActions';

type ComposeState = ReturnType<typeof useExploreComposeRoute>;
type SelectionState = ReturnType<typeof useExploreSelectionActions>;

type Props = {
  compose: ComposeState;
  selection: SelectionState;
  organizeWizardOpen: boolean;
  organizeWizardPrefill: OrganizeWizardPrefill | null;
  pathname: string;
  search: string;
  signInHref: string;
  planWithBuddyUserId: string | null;
  composeAreaSlug: string | null;
  hostRemoveParticipantNotice: string | null;
  rideshareLinkParent: ActivityDTO | null;
  rideshareLinkDemand: ExploreMapItemDTO | null;
  onCloseCreateFlow: () => void;
  onOrganizeBackToIntent: () => void;
  onActivityPublished: (activity: ActivityDTO) => Promise<void>;
  onCreateLinkedRideshare: (parent: ActivityDTO) => void;
  onOpenHostApplication: () => void;
  onRefreshHostGate: () => void;
  setRideshareLinkParent: (value: ActivityDTO | null) => void;
  setRideshareLinkDemand: (value: ExploreMapItemDTO | null) => void;
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
  organizeWizardOpen,
  organizeWizardPrefill,
  signInHref,
  planWithBuddyUserId,
  composeAreaSlug,
  hostRemoveParticipantNotice,
  rideshareLinkParent,
  rideshareLinkDemand,
  onCloseCreateFlow,
  onOrganizeBackToIntent,
  onActivityPublished,
  onCreateLinkedRideshare,
  onOpenHostApplication,
  onRefreshHostGate,
  setRideshareLinkParent,
  setRideshareLinkDemand,
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

    <ExploreComposeHost
      exploreCompose={compose.exploreCompose}
      composeMenuOpen={compose.composeMenuOpen}
      organizeWizardOpen={organizeWizardOpen}
      findWizardOpen={Boolean(compose.findRoute)}
      addWizardOpen={Boolean(compose.addRoute)}
      organizeKind={compose.organizeRoute?.kind ?? null}
      findKind={compose.findRoute?.kind}
      addKind={compose.addRoute?.kind ?? null}
      organizeWizardPrefill={organizeWizardPrefill}
      signInHref={signInHref}
      onComposeRouteChange={compose.handleComposeRouteChange}
      onCloseCompose={compose.closeCompose}
      onCloseCreateFlow={onCloseCreateFlow}
      onOrganizeBackToIntent={onOrganizeBackToIntent}
      onFindBackToIntent={() => compose.setComposeRoute({ surface: 'menu', intent: 'find' })}
      onAddBackToIntent={() => compose.setComposeRoute({ surface: 'menu', intent: 'add' })}
      onActivityPublished={async (activity) => {
        await onActivityPublished(activity);
        if (rideshareLinkParent && activity.activityType === 'rideshare') {
          setRideshareLinkParent(null);
        }
        if (rideshareLinkDemand && activity.activityType === 'rideshare') {
          setRideshareLinkDemand(null);
        }
        void onRefreshHostGate();
      }}
      onDemandSubmitted={(result) => {
        selection.handleDemandSubmitted(result);
        void onRefreshHostGate();
      }}
      onCreateLinkedRideshare={onCreateLinkedRideshare}
      tenantId={tenantId}
      planWithBuddyUserId={planWithBuddyUserId}
      composeAreaSlug={composeAreaSlug}
      onOpenHostApplication={onOpenHostApplication}
      onContributeSubmitted={selection.handleContributeSubmitted}
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
