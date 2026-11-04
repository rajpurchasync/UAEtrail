import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext,
} from '../HostingWizardChrome';
import { EXPLORE_FLOW } from '../../../../config/exploreTheme';
import { OFFLINE_PRICE_NOTE, priceModeLabel, priceModeOptions } from '../../hostingFlowEngine';
import { validateHostingPrice } from '../../hostingFlows/validateShared';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';

const DESKTOP_PRICE_CARD_HEIGHT = 'h-[17.75rem]';

export function renderPriceStep(ctx: HostingWizardContext): ReactNode | null {
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

  const priceValidation = validateHostingPrice(draft);
  const showPaidFields = draft.priceMode !== 'free';
  const modes = priceModeOptions(kind, hostTiers, publishingProfileKind);

  const priceModeButtonClass = (active: boolean, stacked?: boolean) =>
    `rounded-2xl border-2 px-3 text-sm font-bold ${
      stacked ? 'flex flex-1 items-center justify-center py-4 md:text-sm' : 'py-3 md:rounded-md md:py-2 md:text-xs'
    } ${active ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-neutral-200 text-neutral-800'}`;

  return (
    <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
      <div className="grid grid-cols-2 gap-2 md:hidden">
        {modes.map((mode) => {
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
              className={priceModeButtonClass(active)}
            >
              {priceModeLabel(mode, kind)}
            </button>
          );
        })}
      </div>

      <div className="hidden md:grid md:grid-cols-[minmax(9.5rem,11rem)_minmax(0,1.35fr)] md:items-start md:gap-6">
        <div
          className={`flex ${DESKTOP_PRICE_CARD_HEIGHT} flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 p-3`}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            {modes.map((mode) => {
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
                  className={priceModeButtonClass(active, true)}
                >
                  {priceModeLabel(mode, kind)}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={`flex ${DESKTOP_PRICE_CARD_HEIGHT} flex-col overflow-hidden rounded-2xl border p-3 ${
            showPaidFields ? 'border-neutral-200 bg-neutral-50' : 'border-dashed border-neutral-200 bg-neutral-50/40'
          }`}
        >
          {!showPaidFields ? (
            <p className="flex flex-1 items-center justify-center px-2 text-center text-xs leading-snug text-neutral-400">
              Choose paid or shared cost to add amount and notes.
            </p>
          ) : (
            <>
              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <label className="block shrink-0">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {draft.priceMode === 'shared' ? 'AED shared' : 'AED amount'}
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={draft.priceAmount || ''}
                    onChange={(event) => patchDraft({ priceAmount: Number(event.target.value) || 0 })}
                    className={EXPLORE_FLOW.composeField}
                  />
                </label>
                {draft.priceMode === 'shared' ? (
                  <label className="flex min-h-0 flex-1 flex-col">
                    <span className="mb-1 block shrink-0 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Shared for
                    </span>
                    <textarea
                      value={draft.sharedCostNote}
                      onChange={(event) => patchDraft({ sharedCostNote: event.target.value })}
                      placeholder="Fuel, park entry, gear rental…"
                      className={`${EXPLORE_FLOW.composeField} min-h-0 flex-1 resize-none`}
                    />
                  </label>
                ) : (
                  <p className="text-xs leading-snug text-neutral-400">
                    Amount is per person unless you note otherwise in the outing description.
                  </p>
                )}
              </div>
              <p className="mt-2 shrink-0 border-t border-neutral-200/80 pt-2 text-[11px] leading-snug text-neutral-500">
                {OFFLINE_PRICE_NOTE}
              </p>
            </>
          )}
        </div>
      </div>

      <div
        className={`mt-4 rounded-xl border p-2.5 md:hidden ${
          showPaidFields ? 'border-neutral-200 bg-neutral-50/80' : 'border-dashed border-neutral-200 bg-neutral-50/40'
        }`}
      >
        {!showPaidFields ? (
          <p className="px-1 py-4 text-center text-xs leading-snug text-neutral-400">
            Paid or shared cost details appear here.
          </p>
        ) : (
          <div className="space-y-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                {draft.priceMode === 'shared' ? 'AED shared' : 'AED amount'}
              </span>
              <input
                type="number"
                min={1}
                value={draft.priceAmount || ''}
                onChange={(event) => patchDraft({ priceAmount: Number(event.target.value) || 0 })}
                className={EXPLORE_FLOW.composeField}
              />
            </label>
            {draft.priceMode === 'shared' ? (
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                  Shared for
                </span>
                <textarea
                  value={draft.sharedCostNote}
                  onChange={(event) => patchDraft({ sharedCostNote: event.target.value })}
                  rows={3}
                  placeholder="Fuel, park entry…"
                  className={`${EXPLORE_FLOW.composeField} resize-none`}
                />
              </label>
            ) : null}
            <p className="text-[11px] leading-snug text-neutral-500">{OFFLINE_PRICE_NOTE}</p>
          </div>
        )}
      </div>
      <HostingWizardStepError error={error ?? priceValidation} />
      <HostingWizardStepNext disabled={Boolean(priceValidation)} onClick={goNext} />
    </HostingWizardChrome>
  );
}
