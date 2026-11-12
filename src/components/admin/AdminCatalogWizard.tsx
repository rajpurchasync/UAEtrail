import type { ReactNode } from 'react';

export type AdminCatalogStep = {
  id: string;
  label: string;
};

type AdminCatalogWizardProps = {
  title: string;
  steps: AdminCatalogStep[];
  stepIndex: number;
  onStepChange: (index: number) => void;
  onClose: () => void;
  onBack?: () => void;
  onNext?: () => void;
  onSave: () => void;
  saving?: boolean;
  canNext?: boolean;
  children: ReactNode;
};

/** Multi-step create/edit shell for catalog entities (identity → pin/media → publish). */
export const AdminCatalogWizard = ({
  title,
  steps,
  stepIndex,
  onStepChange,
  onClose,
  onBack,
  onNext,
  onSave,
  saving = false,
  canNext = true,
  children,
}: AdminCatalogWizardProps) => {
  const isLast = stepIndex >= steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" role="dialog" aria-modal>
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-neutral-200 bg-white shadow-xl sm:rounded-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-neutral-100 px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
            <p className="text-xs text-neutral-500">
              Step {stepIndex + 1} of {steps.length}: {steps[stepIndex]?.label}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-xl leading-none text-neutral-400 hover:text-neutral-700" aria-label="Close">
            ×
          </button>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-neutral-100 px-4 py-2 sm:px-5" aria-label="Wizard steps">
          {steps.map((step, index) => {
            const active = index === stepIndex;
            const done = index < stepIndex;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepChange(index)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                  active
                    ? 'bg-emerald-50 text-emerald-800'
                    : done
                      ? 'bg-neutral-100 text-neutral-700'
                      : 'text-neutral-400 hover:bg-neutral-50'
                }`}
              >
                {index + 1}. {step.label}
              </button>
            );
          })}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>

        <footer className="flex items-center justify-between gap-2 border-t border-neutral-100 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onBack}
            disabled={stepIndex === 0 || saving}
            className="rounded-xl px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-40"
          >
            Back
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            {isLast ? (
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onNext}
                disabled={!canNext || saving}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                Next
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};
