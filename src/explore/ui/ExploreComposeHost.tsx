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
      />
    )}

    {findWizardOpen && (
      <CreateDemandFlow
        open={findWizardOpen}
        onClose={onCloseCompose}
        findKind={findKind ?? null}
        onBackToIntent={onFindBackToIntent}
        onSubmitted={onDemandSubmitted}
        signInHref={signInHref}
      />
    )}
  </>
);
