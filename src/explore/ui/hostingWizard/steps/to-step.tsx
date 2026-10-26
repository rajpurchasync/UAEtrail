import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext,
} from '../HostingWizardChrome';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';
import { RideshareDestinationCommunityStep } from './RideshareDestinationCommunityStep';
import { hostHasProRideshareMapDestination } from '../../../rideshareDestinationPolicy';

const communityDestinationReady = (ctx: HostingWizardContext): boolean => {
  const { draft, hasToPin } = ctx;
  if (!hasToPin || !draft.rideshareDestinationKind) return false;
  if (draft.rideshareDestinationKind === 'activity_meeting') {
    return Boolean(draft.rideshareDestinationActivityId?.trim());
  }
  if (
    draft.rideshareDestinationKind === 'catalog_place' ||
    draft.rideshareDestinationKind === 'pending_place'
  ) {
    return Boolean(draft.rideshareDestinationPlaceId?.trim());
  }
  return false;
};

export function renderToStep(ctx: HostingWizardContext): ReactNode | null {
  const {
    step,
    stepTitle,
    kind,
    error,
    hasToPin,
    goNext,
    goBack,
    handleClose,
    setRouteMapTarget,
    hostTiers,
    patchDraft,
  } = ctx;

  if (!(step === 'to' && kind === 'rideshare')) {
    return null;
  }

  const proMap = hostHasProRideshareMapDestination(hostTiers);
  const nextDisabled = proMap ? !hasToPin : !communityDestinationReady(ctx);

  const openMap = () => {
    if (proMap) {
      patchDraft({
        rideshareDestinationKind: 'map',
        rideshareDestinationActivityId: null,
        rideshareDestinationPlaceId: null,
        rideshareDestinationDetailLine: null,
        rideshareDestinationPlaceLabel: null,
      });
    }
    setRouteMapTarget('to');
  };

  return (
    <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
      <RideshareDestinationCommunityStep ctx={ctx} onOpenMap={openMap} />
      {proMap ? <HostingWizardStepError error={error} /> : null}
      <HostingWizardStepNext disabled={nextDisabled} onClick={goNext} />
    </HostingWizardChrome>
  );
}
