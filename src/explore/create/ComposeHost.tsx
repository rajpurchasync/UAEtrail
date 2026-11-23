import type { ActivityDTO } from '@uaetrail/shared-types';
import type {
  ExploreCompose,
  IntentFixedComposeKind,
  ActivityComposeKind,
} from '../compose';
import type { AddVenueKind } from '../addTypes';
import { HostingFlowHost } from './hosting/HostingFlowHost';
import { CreateAddFlow } from '../ui/CreateAddFlow';
import { CreateAddFacilityFlow } from '../ui/CreateAddFacilityFlow';
import type { AddSubmitResult } from '../ui/addFlow';
import { CreateAvailabilityFixedFlow } from '../ui/CreateAvailabilityFixedFlow';
import type { AvailabilityFixedSubmitResult } from '../ui/intentFixedFlowEngine';
import { CreateKindSheet } from '../ui/CreateKindSheet';
import { IntentOpenComposeSheet } from '../ui/IntentOpenComposeSheet';
import { ComposeSheetExpandedProvider } from './ComposeSheetExpandedContext';
import { ComposeWizardNavigationProvider } from './ComposeWizardNavigationContext';

export interface ComposeHostProps {
  composeRoute: ExploreCompose | null;
  composeMenuOpen: boolean;
  activityWizardOpen: boolean;
  /** Intent — fixed map slot (`intent:fixed:*` wire; legacy inbound compat in shared-types). */
  intentFixedWizardOpen: boolean;
  placeWizardOpen: boolean;
  /** Intent — open days (`intent:open` wire). */
  intentOpenWizardOpen: boolean;
  activityComposeKind: ActivityComposeKind | null;
  intentFixedKind: IntentFixedComposeKind | null | undefined;
  addVenueKind: AddVenueKind | null;
  hostingWizardPrefill: import('../ui/hostingWizardPrefill').HostingWizardPrefill | null;
  signInHref: string;
  onComposeRouteChange: (route: ExploreCompose | null) => void;
  onCloseCompose: () => void;
  onCloseCreateFlow: () => void;
  onHostingBackToIntent: () => void;
  onAvailabilityBackToIntent: () => void;
  onAddBackToIntent: () => void;
  onActivityPublished: (activity: ActivityDTO) => void | Promise<void>;
  onOpenHostApplication: () => void;
  onAddSubmitted: (result: AddSubmitResult) => void;
  onAvailabilityFixedSubmitted: (result: AvailabilityFixedSubmitResult) => void;
  onCreateLinkedRideshare?: (parentActivity: ActivityDTO) => void;
  tenantId?: string | null;
  planWithBuddyUserId?: string | null;
  /** When map is scoped with `?area=`, prefill seeking/add curated area steps. */
  composeAreaSlug?: string | null;
  /** `?capacity=guide` on intent open compose. */
  intentOpenCapacityParam?: string | null;
  /** `facilityOnPlace` query — link amenity to trail/camp catalog row. */
  facilityOnPlaceId?: string | null;
  wizardEnteredFromMenu: boolean;
  /** Guest sign-in gate — hide kind picker so it does not stack under z-[6600] sheet. */
  intentMenuSuppressed?: boolean;
}

/** Create-flow shell: activity · place · intent wizards on the current surface. */
export const ComposeHost = ({
  composeRoute,
  composeMenuOpen,
  activityWizardOpen,
  intentFixedWizardOpen,
  placeWizardOpen,
  intentOpenWizardOpen,
  activityComposeKind,
  intentFixedKind,
  addVenueKind,
  hostingWizardPrefill,
  signInHref,
  onComposeRouteChange,
  onCloseCompose,
  onCloseCreateFlow,
  onHostingBackToIntent,
  onAvailabilityBackToIntent,
  onAddBackToIntent,
  onActivityPublished,
  onOpenHostApplication,
  onAddSubmitted,
  onAvailabilityFixedSubmitted,
  onCreateLinkedRideshare,
  tenantId = null,
  planWithBuddyUserId = null,
  composeAreaSlug = null,
  intentOpenCapacityParam = null,
  facilityOnPlaceId = null,
  wizardEnteredFromMenu,
  intentMenuSuppressed = false,
}: ComposeHostProps) => {
  const composeSessionOpen =
    composeMenuOpen ||
    activityWizardOpen ||
    intentFixedWizardOpen ||
    placeWizardOpen ||
    intentOpenWizardOpen;
  const immersiveWizardOpen =
    activityWizardOpen ||
    intentFixedWizardOpen ||
    placeWizardOpen ||
    intentOpenWizardOpen;

  return (
    <ComposeWizardNavigationProvider value={wizardEnteredFromMenu}>
    <ComposeSheetExpandedProvider
      composeSessionOpen={composeSessionOpen}
      immersiveWizardOpen={immersiveWizardOpen}
    >
    {composeMenuOpen && composeRoute && !intentMenuSuppressed && (
      <CreateKindSheet
        route={composeRoute}
        onRouteChange={onComposeRouteChange}
        onClose={onCloseCompose}
      />
    )}

    {placeWizardOpen && addVenueKind === 'facility' && (
      <CreateAddFacilityFlow
        open={placeWizardOpen}
        exploreAreaSlug={composeAreaSlug}
        facilityOnPlaceId={facilityOnPlaceId}
        onClose={onCloseCompose}
        onBackToIntent={onAddBackToIntent}
        onSubmitted={onAddSubmitted}
        signInHref={signInHref}
      />
    )}

    {placeWizardOpen && addVenueKind && addVenueKind !== 'facility' && (
      <CreateAddFlow
        open={placeWizardOpen}
        kind={addVenueKind}
        exploreAreaSlug={composeAreaSlug}
        onClose={onCloseCompose}
        onBackToIntent={onAddBackToIntent}
        onSubmitted={onAddSubmitted}
        signInHref={signInHref}
      />
    )}

    {activityWizardOpen && (
      <HostingFlowHost
        open={activityWizardOpen}
        onClose={onCloseCreateFlow}
        hostComposeKind={activityComposeKind}
        hostingWizardPrefill={hostingWizardPrefill}
        onCreateLinkedRideshare={onCreateLinkedRideshare}
        onBackToIntent={onHostingBackToIntent}
        onPublished={onActivityPublished}
        onOpenHostApplication={onOpenHostApplication}
        signInHref={signInHref}
        planWithBuddyUserId={planWithBuddyUserId}
      />
    )}

    {intentOpenWizardOpen && (
      <IntentOpenComposeSheet
        open={intentOpenWizardOpen}
        onClose={onCloseCompose}
        exploreAreaSlug={composeAreaSlug}
        intentOpenCapacityParam={intentOpenCapacityParam}
      />
    )}

    {intentFixedWizardOpen && (
      <CreateAvailabilityFixedFlow
        open={intentFixedWizardOpen}
        onClose={onCloseCompose}
        availabilityFixedKind={intentFixedKind ?? null}
        exploreAreaSlug={composeAreaSlug}
        onBackToIntent={onAvailabilityBackToIntent}
        onSubmitted={onAvailabilityFixedSubmitted}
        signInHref={signInHref}
        tenantId={tenantId}
        onCreateLinkedRideshare={onCreateLinkedRideshare}
      />
    )}
    </ComposeSheetExpandedProvider>
    </ComposeWizardNavigationProvider>
  );
};