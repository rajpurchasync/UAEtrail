import type { ActivityDTO } from '@uaetrail/shared-types';
import type { ExploreCompose, FindComposeKind, OrganizeComposeKind } from '../compose';
import type { ContributeVenueKind } from '../contributeTypes';
import { HostingFlowHost } from './hosting/HostingFlowHost';
import { CreateContributeFlow } from '../ui/CreateContributeFlow';
import { CreateContributeFacilityFlow } from '../ui/CreateContributeFacilityFlow';
import type { ContributeSubmitResult } from '../ui/contributeFlow';
import { CreateSeekingFlow } from '../ui/CreateSeekingFlow';
import type { SeekingSubmitResult } from '../ui/seekingFlowEngine';
import { CreateIntentSheet } from '../ui/CreateIntentSheet';
import { SeekFlexibleComposeSheet } from '../ui/SeekFlexibleComposeSheet';

export interface ComposeHostProps {
  composeRoute: ExploreCompose | null;
  composeMenuOpen: boolean;
  hostWizardOpen: boolean;
  planSeekingWizardOpen: boolean;
  contributeWizardOpen: boolean;
  seekFlexibleOpen: boolean;
  planHostingKind: OrganizeComposeKind | null;
  planSeekingKind: FindComposeKind | null | undefined;
  contributeVenueKind: ContributeVenueKind | null;
  hostingWizardPrefill: import('../ui/organizeWizardPrefill').OrganizeWizardPrefill | null;
  signInHref: string;
  onComposeRouteChange: (route: ExploreCompose | null) => void;
  onCloseCompose: () => void;
  onCloseCreateFlow: () => void;
  onPlanHostingBackToIntent: () => void;
  onPlanSeekingBackToIntent: () => void;
  onContributeBackToIntent: () => void;
  onActivityPublished: (activity: ActivityDTO) => void | Promise<void>;
  onOpenHostApplication: () => void;
  onContributeSubmitted: (result: ContributeSubmitResult) => void;
  onSeekingSubmitted: (result: SeekingSubmitResult) => void;
  onCreateLinkedRideshare?: (parentActivity: ActivityDTO) => void;
  tenantId?: string | null;
  planWithBuddyUserId?: string | null;
  /** When map is scoped with `?area=`, prefill seeking/contribute curated area steps. */
  composeAreaSlug?: string | null;
}

/** FAB compose menu and create wizards — `/explore` and `/list`. */
export const ComposeHost = ({
  composeRoute,
  composeMenuOpen,
  hostWizardOpen,
  planSeekingWizardOpen,
  contributeWizardOpen,
  seekFlexibleOpen,
  planHostingKind,
  planSeekingKind,
  contributeVenueKind,
  hostingWizardPrefill,
  signInHref,
  onComposeRouteChange,
  onCloseCompose,
  onCloseCreateFlow,
  onPlanHostingBackToIntent,
  onPlanSeekingBackToIntent,
  onContributeBackToIntent,
  onActivityPublished,
  onOpenHostApplication,
  onContributeSubmitted,
  onSeekingSubmitted,
  onCreateLinkedRideshare,
  tenantId = null,
  planWithBuddyUserId = null,
  composeAreaSlug = null,
}: ComposeHostProps) => (
  <>
    {composeMenuOpen && composeRoute && (
      <CreateIntentSheet
        route={composeRoute}
        onRouteChange={onComposeRouteChange}
        onClose={onCloseCompose}
      />
    )}

    {contributeWizardOpen && contributeVenueKind === 'facility' && (
      <CreateContributeFacilityFlow
        open={contributeWizardOpen}
        exploreAreaSlug={composeAreaSlug}
        onClose={onCloseCompose}
        onBackToIntent={onContributeBackToIntent}
        onSubmitted={onContributeSubmitted}
        signInHref={signInHref}
      />
    )}

    {contributeWizardOpen && contributeVenueKind && contributeVenueKind !== 'facility' && (
      <CreateContributeFlow
        open={contributeWizardOpen}
        kind={contributeVenueKind}
        exploreAreaSlug={composeAreaSlug}
        onClose={onCloseCompose}
        onBackToIntent={onContributeBackToIntent}
        onSubmitted={onContributeSubmitted}
        signInHref={signInHref}
      />
    )}

    {hostWizardOpen && (
      <HostingFlowHost
        open={hostWizardOpen}
        onClose={onCloseCreateFlow}
        planHostingKind={planHostingKind}
        hostingWizardPrefill={hostingWizardPrefill}
        onCreateLinkedRideshare={onCreateLinkedRideshare}
        onBackToIntent={onPlanHostingBackToIntent}
        onPublished={onActivityPublished}
        onOpenHostApplication={onOpenHostApplication}
        signInHref={signInHref}
        planWithBuddyUserId={planWithBuddyUserId}
      />
    )}

    {seekFlexibleOpen && (
      <SeekFlexibleComposeSheet
        open={seekFlexibleOpen}
        onClose={onCloseCompose}
        exploreAreaSlug={composeAreaSlug}
      />
    )}

    {planSeekingWizardOpen && (
      <CreateSeekingFlow
        open={planSeekingWizardOpen}
        onClose={onCloseCompose}
        findKind={planSeekingKind ?? null}
        exploreAreaSlug={composeAreaSlug}
        onBackToIntent={onPlanSeekingBackToIntent}
        onSubmitted={onSeekingSubmitted}
        signInHref={signInHref}
        tenantId={tenantId}
        onCreateLinkedRideshare={onCreateLinkedRideshare}
      />
    )}
  </>
);
