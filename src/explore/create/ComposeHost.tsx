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
  seekFixedWizardOpen: boolean;
  addWizardOpen: boolean;
  seekFlexibleOpen: boolean;
  hostComposeKind: HostComposeKind | null;
  seekFixedKind: SeekingComposeKind | null | undefined;
  addVenueKind: AddVenueKind | null;
  hostingWizardPrefill: import('../ui/hostingWizardPrefill').HostingWizardPrefill | null;
  signInHref: string;
  onComposeRouteChange: (route: ExploreCompose | null) => void;
  onCloseCompose: () => void;
  onCloseCreateFlow: () => void;
  onHostingBackToIntent: () => void;
  onSeekingBackToIntent: () => void;
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
}

/** Create-flow host (trip / venue / seek wizards) — overlay on the current surface. */
export const ComposeHost = ({
  composeRoute,
  composeMenuOpen,
  hostWizardOpen,
  seekFixedWizardOpen,
  addWizardOpen,
  seekFlexibleOpen,
  hostComposeKind,
  seekFixedKind,
  addVenueKind,
  hostingWizardPrefill,
  signInHref,
  onComposeRouteChange,
  onCloseCompose,
  onCloseCreateFlow,
  onHostingBackToIntent,
  onSeekingBackToIntent,
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
}: ComposeHostProps) => {
  const composeSessionOpen =
    composeMenuOpen ||
    hostWizardOpen ||
    seekFixedWizardOpen ||
    addWizardOpen ||
    seekFlexibleOpen;
  const immersiveWizardOpen =
    hostWizardOpen ||
    seekFixedWizardOpen ||
    addWizardOpen ||
    seekFlexibleOpen;

  return (
    <ComposeWizardNavigationProvider value={wizardEnteredFromMenu}>
    <ComposeSheetExpandedProvider
      composeSessionOpen={composeSessionOpen}
      immersiveWizardOpen={immersiveWizardOpen}
    >
    {composeMenuOpen && composeRoute && (
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

    {seekFlexibleOpen && (
      <SeekFlexibleComposeSheet
        open={seekFlexibleOpen}
        onClose={onCloseCompose}
        onBackToIntent={onSeekingBackToIntent}
        exploreAreaSlug={composeAreaSlug}
      />
    )}

    {seekFixedWizardOpen && (
      <CreateSeekingFlow
        open={seekFixedWizardOpen}
        onClose={onCloseCompose}
        seekKind={seekFixedKind ?? null}
        exploreAreaSlug={composeAreaSlug}
        onBackToIntent={onSeekingBackToIntent}
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
