import type { ActivityDTO } from '@uaetrail/shared-types';
import type { ExploreCompose, FindComposeKind, OrganizeComposeKind } from '../compose';
import type { ContributeVenueKind } from '../contributeTypes';
import { ComposeHost } from '../create/ComposeHost';
import type { ContributeSubmitResult } from './contributeFlow';
import type { DemandSubmitResult } from './demandFlow';

/** @deprecated Use {@link ComposeHostProps} from `src/explore/create/ComposeHost.tsx`. */
export interface ExploreComposeHostProps {
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
  composeAreaSlug?: string | null;
}

/** @deprecated Use {@link ComposeHost}. */
export const ExploreComposeHost = (props: ExploreComposeHostProps) => (
  <ComposeHost
    composeRoute={props.exploreCompose}
    composeMenuOpen={props.composeMenuOpen}
    hostWizardOpen={props.organizeWizardOpen}
    planSeekingWizardOpen={props.findWizardOpen}
    contributeWizardOpen={props.addWizardOpen}
    seekFlexibleOpen={false}
    planHostingKind={props.organizeKind}
    planSeekingKind={props.findKind}
    contributeVenueKind={props.addKind}
    hostingWizardPrefill={props.organizeWizardPrefill}
    signInHref={props.signInHref}
    onComposeRouteChange={props.onComposeRouteChange}
    onCloseCompose={props.onCloseCompose}
    onCloseCreateFlow={props.onCloseCreateFlow}
    onPlanHostingBackToIntent={props.onOrganizeBackToIntent}
    onPlanSeekingBackToIntent={props.onFindBackToIntent}
    onContributeBackToIntent={props.onAddBackToIntent}
    onActivityPublished={props.onActivityPublished}
    onOpenHostApplication={props.onOpenHostApplication}
    onContributeSubmitted={props.onContributeSubmitted}
    onDemandSubmitted={props.onDemandSubmitted}
    onCreateLinkedRideshare={props.onCreateLinkedRideshare}
    tenantId={props.tenantId}
    planWithBuddyUserId={props.planWithBuddyUserId}
    composeAreaSlug={props.composeAreaSlug}
  />
);
