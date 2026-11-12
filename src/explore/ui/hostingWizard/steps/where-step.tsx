import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext
} from '../HostingWizardChrome';
import {
  ComposeMapEntryRow,
  formatComposeMapCoord,
} from '../../../create/interactions';
import { WHERE_STEP_CAMP_HINT, WHERE_STEP_HINT } from '../../../createFlowCopy';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';

export function renderWhereStep(ctx: HostingWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    kind,
    draft,
    error,
    hasFromPin,
    openGoingFromMap,
    goNext,
    goBack,
    handleClose,
  } = ctx;

  if (!(step === 'where' && kind)) {
    return null;
  }

  const camping = kind === 'camping';

  return (
          <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <p className="mb-4 text-sm text-gray-600">
              {camping ? WHERE_STEP_CAMP_HINT : WHERE_STEP_HINT}
            </p>
            <ComposeMapEntryRow
              title={camping ? 'Camp location' : 'Location pin'}
              subtitle={
                hasFromPin
                  ? formatComposeMapCoord(draft.latitude, draft.longitude, true)
                  : camping
                    ? 'Tap to choose camp location'
                    : formatComposeMapCoord(draft.latitude, draft.longitude, false)
              }
              placed={hasFromPin}
              onOpen={openGoingFromMap}
            />
            <HostingWizardStepError error={error} />
            <HostingWizardStepNext disabled={!hasFromPin} onClick={goNext}  />
          </HostingWizardChrome>
  );
}
