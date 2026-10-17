import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext
} from '../OrganizeWizardChrome';
import { OFFLINE_PRICE_NOTE, priceModeLabel, priceModeOptions } from '../../hostingFlowEngine';
import { validateOrganizePrice } from '../../hostingFlows/validateShared';
import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from '../organizeWizardContext';

export function renderPriceStep(ctx: OrganizeWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    kind,
    draft,
    patchDraft,
    error,
    hostTiers,
    publishingProfileKind,
    goNext,
    goBack,
    handleClose,
  } = ctx;

  if (!(step === 'price' && kind)) {
    return null;
  }

  const priceValidation = validateOrganizePrice(draft);

  return (
          <OrganizeWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <div className="grid grid-cols-2 gap-2">
              {priceModeOptions(kind, hostTiers, publishingProfileKind).map((mode) => {
                const active = draft.priceMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() =>
                      patchDraft({
                        priceMode: mode,
                        priceAmount: mode === 'free' ? 0 : draft.priceAmount,
                      })
                    }
                    className={`rounded-2xl border-2 px-3 py-3 text-sm font-bold ${
                      active ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-neutral-200 text-gray-800'
                    }`}
                  >
                    {priceModeLabel(mode, kind)}
                  </button>
                );
              })}
            </div>
            {draft.priceMode !== 'free' && (
              <label className="mt-4 block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {draft.priceMode === 'shared' ? 'AED shared cost' : 'AED amount'}
                </span>
                <input
                  type="number"
                  min={1}
                  value={draft.priceAmount || ''}
                  onChange={(event) => patchDraft({ priceAmount: Number(event.target.value) || 0 })}
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base font-semibold text-gray-900"
                />
              </label>
            )}
            {draft.priceMode === 'shared' && (
              <label className="mt-3 block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  What is this cost shared for?
                </span>
                <textarea
                  value={draft.sharedCostNote}
                  onChange={(event) => patchDraft({ sharedCostNote: event.target.value })}
                  rows={2}
                  placeholder="e.g. Fuel, park entry, shared gear…"
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500"
                />
              </label>
            )}
            {draft.priceMode !== 'free' && (
              <p className="mt-2 text-xs text-gray-500">{OFFLINE_PRICE_NOTE}</p>
            )}
            <OrganizeWizardStepError error={error ?? priceValidation} />
            <OrganizeWizardStepNext disabled={Boolean(priceValidation)} onClick={goNext} />
          </OrganizeWizardChrome>
  );
}
