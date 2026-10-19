import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext
} from '../HostingWizardChrome';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';

export function renderRouteStep(ctx: HostingWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    kind,
    error,
    hasFromPin,
    hasToPin,
    goNext,
    goBack,
    handleClose,
    renderRoutePicker,
  } = ctx;

  if (!(step === 'route' && kind === 'rideshare')) {
    return null;
  }

  return (
          <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <p className="mb-4 text-sm text-gray-600">Set both pickup and destination on the map.</p>
            <div className="space-y-3">
              {renderRoutePicker('from')}
              {renderRoutePicker('to')}
            </div>
            <HostingWizardStepError error={error} />
            <HostingWizardStepNext disabled={!hasFromPin || !hasToPin} onClick={goNext}  />
          </HostingWizardChrome>
  );
}
