import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext
} from '../HostingWizardChrome';
import { CAPACITY_PRESETS, formatCapacityLabel } from '../../hostingFlowEngine';
import { JOIN_RULES_LABEL } from '../../../createFlowCopy';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';

export function renderInstructionsEventStep(ctx: HostingWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    kind,
    draft,
    patchDraft,
    error,
    goNext,
    goBack,
    handleClose,
  } = ctx;

  if (!(step === 'instructions' && kind === 'event')) {
    return null;
  }

  return (
          <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">About this event</span>
              <textarea
                value={draft.description}
                onChange={(event) => patchDraft({ description: event.target.value })}
                rows={3}
                placeholder="What to expect, schedule highlights, vibe…"
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
                maxLength={1200}
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-gray-700">{JOIN_RULES_LABEL}</span>
              <textarea
                value={draft.additionalInstructions}
                onChange={(event) => patchDraft({ additionalInstructions: event.target.value })}
                rows={4}
                placeholder="Safety rules, gear requirements, house rules joiners must accept…"
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
                maxLength={1000}
              />
              <span className="mt-1 block text-xs text-gray-500">
                Joiners must read and agree to these before requesting a spot.
              </span>
            </label>
            <p className="mt-4 mb-2 text-sm font-semibold text-gray-900">How many spots?</p>
            <div className="flex flex-wrap gap-2">
              {CAPACITY_PRESETS.map((value) => {
                const active = draft.capacity === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => patchDraft({ capacity: value })}
                    className={`rounded-full px-4 py-2 text-sm font-bold ${
                      active ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-gray-800'
                    }`}
                  >
                    {formatCapacityLabel(value)}
                  </button>
                );
              })}
            </div>
            <HostingWizardStepError error={error} />
            <HostingWizardStepNext disabled={!draft.additionalInstructions.trim()} onClick={goNext}  />
          </HostingWizardChrome>
  );
}
