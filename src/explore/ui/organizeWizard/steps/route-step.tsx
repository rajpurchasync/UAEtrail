import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext
} from '../OrganizeWizardChrome';
import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from '../organizeWizardContext';

export function renderRouteStep(ctx: OrganizeWizardContext): ReactNode | null {
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

  if (!(step === 'route' && kind === 'carpool')) {
    return null;
  }

  return (
          <OrganizeWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <p className="mb-4 text-sm text-gray-600">Set both pickup and destination on the map.</p>
            <div className="space-y-3">
              {renderRoutePicker('from')}
              {renderRoutePicker('to')}
            </div>
            <OrganizeWizardStepError error={error} />
            <OrganizeWizardStepNext disabled={!hasFromPin || !hasToPin} onClick={goNext}  />
          </OrganizeWizardChrome>
  );
}
