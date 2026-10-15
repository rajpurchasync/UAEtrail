import type { ActivityDTO } from '@uaetrail/shared-types';
import type { ExploreCompose, FindComposeKind, OrganizeComposeKind } from '../compose';
import type { ContributeVenueKind } from '../contributeTypes';
import { CreateOrganizeFlowHost } from './createOrganize/CreateOrganizeFlowHost';
import { CreateContributeFlow } from './CreateContributeFlow';
import type { ContributeSubmitResult } from './contributeFlow';
import { CreateDemandFlow } from './CreateDemandFlow';
import type { DemandSubmitResult } from './demandFlow';
import { CreateIntentSheet } from './CreateIntentSheet';
interface ExploreComposeHostProps {
  exploreCompose: ExploreCompose | null;
  composeMenuOpen: boolean;
  organizeWizardOpen: boolean;
  findWizardOpen: boolean;
  addWizardOpen: boolean;
  organizeKind: OrganizeComposeKind | null;
  findKind: FindComposeKind | null | undefined;
  addKind: ContributeVenueKind | null;
  organizeWizardPrefill: import('./organizeWizardPrefill').OrganizeWizardPrefill | null;
  signInHref: string;
  onComposeRouteChange: (route: ExploreCompose | null) => void;
  onCloseCompose: () => void;
  onCloseCreateFlow: () => void;
  onOrganizeBackToIntent: () => void;
  onFindBackToIntent: () => void;
  onAddBackToIntent: () => void;
  onActivityPublished: (activity: ActivityDTO) => void | Promise<void>;
  onOpenHostApplication: () => void;
  onContributeSubmitted: (result: ContributeSubmitResult) => void;
  onDemandSubmitted: (result: DemandSubmitResult) => void;
  onCreateLinkedRideshare?: (parentActivity: ActivityDTO) => void;
  tenantId?: string | null;
  planWithBuddyUserId?: string | null;
  /** When explore is scoped with `?area=`, prefill Find/Add curated area steps. */
  composeAreaSlug?: string | null;
}

/** FAB compose menu and create wizards — mounted once at explore shell level. */
export const ExploreComposeHost = ({
  exploreCompose,
  composeMenuOpen,
  organizeWizardOpen,
  findWizardOpen,
  addWizardOpen,
  organizeKind,
  findKind,
  addKind,
  organizeWizardPrefill,
  signInHref,
  onComposeRouteChange,
  onCloseCompose,
  onCloseCreateFlow,
  onOrganizeBackToIntent,
  onFindBackToIntent,
  onAddBackToIntent,
  onActivityPublished,
  onOpenHostApplication,
  onContributeSubmitted,
  onDemandSubmitted,
  onCreateLinkedRideshare,
  tenantId = null,
  planWithBuddyUserId = null,
  composeAreaSlug = null,
}: ExploreComposeHostProps) => (
  <>
    {composeMenuOpen && exploreCompose && (
      <CreateIntentSheet
        route={exploreCompose}
        onRouteChange={onComposeRouteChange}
        onClose={onCloseCompose}
      />
    )}

    {addWizardOpen && addKind && (
      <CreateContributeFlow
        open={addWizardOpen}
        kind={addKind}
        exploreAreaSlug={composeAreaSlug}
        onClose={onCloseCompose}
        onBackToIntent={onAddBackToIntent}
        onSubmitted={onContributeSubmitted}
        signInHref={signInHref}
      />
    )}

    {organizeWizardOpen && (
      <CreateOrganizeFlowHost
        open={organizeWizardOpen}
        onClose={onCloseCreateFlow}
        organizeKind={organizeKind}
        demandPrefill={organizeWizardPrefill}
        onCreateLinkedRideshare={onCreateLinkedRideshare}
        onBackToIntent={onOrganizeBackToIntent}
        onPublished={onActivityPublished}
        onOpenHostApplication={onOpenHostApplication}
        signInHref={signInHref}
        planWithBuddyUserId={planWithBuddyUserId}
      />
    )}

    {findWizardOpen && (
      <CreateDemandFlow
        open={findWizardOpen}
        onClose={onCloseCompose}
        findKind={findKind ?? null}
        exploreAreaSlug={composeAreaSlug}
        onBackToIntent={onFindBackToIntent}
        onSubmitted={onDemandSubmitted}
        signInHref={signInHref}
        tenantId={tenantId}
        onCreateLinkedRideshare={onCreateLinkedRideshare}
      />
    )}
  </>
);
