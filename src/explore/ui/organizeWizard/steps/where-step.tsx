import { MapPin } from 'lucide-react';
import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext
} from '../OrganizeWizardChrome';
import { EXPLORE_FLOW } from '../../../../config/exploreTheme';
import { WHERE_STEP_CAMP_HINT, WHERE_STEP_HINT } from '../../../createFlowCopy';
import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from '../organizeWizardContext';

export function renderWhereStep(ctx: OrganizeWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    kind,
    draft,
    error,
    hasFromPin,
    setWhereMapOpen,
    goNext,
    goBack,
    handleClose,
  } = ctx;

  if (!(step === 'where' && kind)) {
    return null;
  }

  return (
          <OrganizeWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <p className="mb-4 text-sm text-gray-600">
              {kind === 'camping' ? WHERE_STEP_CAMP_HINT : WHERE_STEP_HINT}
            </p>
            <button
              type="button"
              onClick={() => setWhereMapOpen(true)}
              className={EXPLORE_FLOW.mapPinCard}
            >
              <span className="flex items-center gap-2 text-gray-800">
                <MapPin className="h-5 w-5 text-emerald-600" />
                <span className="text-sm text-gray-800">
                  {hasFromPin
                    ? `${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}`
                    : kind === 'camping'
                      ? 'Tap to choose camp location'
                      : 'Tap to choose on map'}
                </span>
              </span>
              <span className="text-xs font-semibold text-emerald-700">{hasFromPin ? 'Edit' : 'Map'}</span>
            </button>
            <OrganizeWizardStepError error={error} />
            <OrganizeWizardStepNext disabled={!hasFromPin} onClick={goNext}  />
          </OrganizeWizardChrome>
  );
}
