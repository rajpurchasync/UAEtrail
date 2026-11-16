import type { ActivityDTO } from '@uaetrail/shared-types';
import type { ExploreCompose, SeekingComposeKind, HostComposeKind } from '../compose';
import type { AddVenueKind } from '../addTypes';
import { HostingFlowHost } from './hosting/HostingFlowHost';
import { CreateAddFlow } from '../ui/CreateAddFlow';
import { CreateAddFacilityFlow } from '../ui/CreateAddFacilityFlow';
import type { AddSubmitResult } from '../ui/addFlow';
import { CreateSeekingFlow } from '../ui/CreateSeekingFlow';
import type { SeekingSubmitResult } from '../ui/seekingFlowEngine';
import { CreateIntentSheet } from '../ui/CreateIntentSheet';
import { SeekFlexibleComposeSheet } from '../ui/SeekFlexibleComposeSheet';
import { ComposeSheetExpandedProvider } from './ComposeSheetExpandedContext';
import { ComposeWizardNavigationProvider } from './ComposeWizardNavigationContext';

export interface ComposeHostProps {
  composeRoute: ExploreCompose | null;
  composeMenuOpen: boolean;
  hostWizardOpen: boolean;
  /** Availability — post on map (`seek:fixed:*`). */
  availabilityFixedWizardOpen: boolean;
  addWizardOpen: boolean;
  /** Availability — share days (`seek:flexible`). */
  availabilityFlexibleOpen: boolean;
  hostComposeKind: HostComposeKind | null;
  availabilityFixedKind: SeekingComposeKind | null | undefined;
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
  onSeekingSubmitted: (result: SeekingSubmitResult) => void;
  onCreateLinkedRideshare?: (parentActivity: ActivityDTO) => void;
  tenantId?: string | null;
  planWithBuddyUserId?: string | null;
  /** When map is scoped with `?area=`, prefill seeking/add curated area steps. */
  composeAreaSlug?: string | null;
  /** `facilityOnPlace` query — link amenity to trail/camp catalog row. */
  facilityOnPlaceId?: string | null;
  wizardEnteredFromMenu: boolean;
  /** Guest sign-in gate — hide kind picker so it does not stack under z-[6600] sheet. */
  intentMenuSuppressed?: boolean;
}

/** Create-flow shell: Host · Add · Availability wizards on the current surface (`ComposeHost`). */
export const ComposeHost = ({
  composeRoute,
  composeMenuOpen,
  hostWizardOpen,
  availabilityFixedWizardOpen,
  addWizardOpen,
  availabilityFlexibleOpen,
  hostComposeKind,
  availabilityFixedKind,
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
  onSeekingSubmitted,
  onCreateLinkedRideshare,
  tenantId = null,
  planWithBuddyUserId = null,
  composeAreaSlug = null,
  facilityOnPlaceId = null,
  wizardEnteredFromMenu,
  intentMenuSuppressed = false,
}: ComposeHostProps) => {
  const composeSessionOpen =
    composeMenuOpen ||
    hostWizardOpen ||
    availabilityFixedWizardOpen ||
    addWizardOpen ||
    availabilityFlexibleOpen;
  const immersiveWizardOpen =
    hostWizardOpen ||
    availabilityFixedWizardOpen ||
    addWizardOpen ||
    availabilityFlexibleOpen;

  return (
    <ComposeWizardNavigationProvider value={wizardEnteredFromMenu}>
    <ComposeSheetExpandedProvider
      composeSessionOpen={composeSessionOpen}
      immersiveWizardOpen={immersiveWizardOpen}
    >
    {composeMenuOpen && composeRoute && !intentMenuSuppressed && (
      <CreateIntentSheet
        route={composeRoute}
        onRouteChange={onComposeRouteChange}
        onClose={onCloseCompose}
      />
    )}

    {addWizardOpen && addVenueKind === 'facility' && (
      <CreateAddFacilityFlow
        open={addWizardOpen}
        exploreAreaSlug={composeAreaSlug}
        facilityOnPlaceId={facilityOnPlaceId}
        onClose={onCloseCompose}
        onBackToIntent={onAddBackToIntent}
        onSubmitted={onAddSubmitted}
        signInHref={signInHref}
      />
    )}

    {addWizardOpen && addVenueKind && addVenueKind !== 'facility' && (
      <CreateAddFlow
        open={addWizardOpen}
        kind={addVenueKind}
        exploreAreaSlug={composeAreaSlug}
        onClose={onCloseCompose}
        onBackToIntent={onAddBackToIntent}
        onSubmitted={onAddSubmitted}
        signInHref={signInHref}
      />
    )}

    {hostWizardOpen && (
      <HostingFlowHost
        open={hostWizardOpen}
        onClose={onCloseCreateFlow}
        hostComposeKind={hostComposeKind}
        hostingWizardPrefill={hostingWizardPrefill}
        onCreateLinkedRideshare={onCreateLinkedRideshare}
        onBackToIntent={onHostingBackToIntent}
        onPublished={onActivityPublished}
        onOpenHostApplication={onOpenHostApplication}
        signInHref={signInHref}
        planWithBuddyUserId={planWithBuddyUserId}
      />
    )}

    {availabilityFlexibleOpen && (
      <SeekFlexibleComposeSheet
        open={availabilityFlexibleOpen}
        onClose={onCloseCompose}
        onBackToIntent={onAvailabilityBackToIntent}
        exploreAreaSlug={composeAreaSlug}
      />
    )}

    {availabilityFixedWizardOpen && (
      <CreateSeekingFlow
        open={availabilityFixedWizardOpen}
        onClose={onCloseCompose}
        seekKind={availabilityFixedKind ?? null}
        exploreAreaSlug={composeAreaSlug}
        onBackToIntent={onAvailabilityBackToIntent}
        onSubmitted={onSeekingSubmitted}
        signInHref={signInHref}
        tenantId={tenantId}
        onCreateLinkedRideshare={onCreateLinkedRideshare}
      />
    )}
    </ComposeSheetExpandedProvider>
    </ComposeWizardNavigationProvider>
  );
};
