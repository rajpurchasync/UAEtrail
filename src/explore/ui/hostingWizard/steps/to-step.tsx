import { MapPin } from 'lucide-react';
import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext
} from '../HostingWizardChrome';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';

export function renderToStep(ctx: HostingWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    kind,
    draft,
    error,
    hasToPin,
    goNext,
    goBack,
    handleClose,
    setRouteMapTarget,
  } = ctx;

  if (!(step === 'to' && kind === 'rideshare')) {
    return null;
  }

  return (
          <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <p className="mb-4 text-sm text-gray-600">Set the destination on the map.</p>
            <button
              type="button"
              onClick={() => setRouteMapTarget('to')}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left hover:border-sky-300"
            >
              <span className="flex items-center gap-2 text-gray-800">
                <MapPin className="h-5 w-5 text-sky-500" />
                <span>
                  <span className="block text-sm font-bold">Destination pin</span>
                  <span className="text-xs text-gray-500">
                    {hasToPin
                      ? `${draft.toLatitude?.toFixed(4)}, ${draft.toLongitude?.toFixed(4)}`
                      : 'Tap to choose on map'}
                  </span>
                </span>
              </span>
              <span className="text-xs font-semibold text-sky-600">{hasToPin ? 'Edit' : 'Map'}</span>
            </button>
            <HostingWizardStepError error={error} />
            <HostingWizardStepNext disabled={!hasToPin} onClick={goNext}  />
          </HostingWizardChrome>
  );
}
