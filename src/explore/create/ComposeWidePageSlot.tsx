import type { ReactNode } from 'react';
import { ComposeWizardStepChrome } from './ComposeWizardShell';

type ComposeWidePageSlotProps = {
  stepId: string;
  pageSteps: readonly string[];
  title: string;
  pageTitle: string;
  onClose: () => void;
  onBack: () => void;
  children: ReactNode;
  footer: ReactNode;
};

/** Stacks several wizard fields under one chrome on tablet/desktop pages. */
export const ComposeWidePageSlot = ({
  stepId,
  pageSteps,
  title,
  pageTitle,
  onClose,
  onBack,
  children,
  footer,
}: ComposeWidePageSlotProps) => {
  const index = pageSteps.indexOf(stepId);
  if (index < 0) return null;
  const first = index === 0;
  const last = index === pageSteps.length - 1;
  const body = (
    <section className={first ? undefined : 'mt-5 border-t border-neutral-100 pt-4'}>
      {pageSteps.length > 1 ? (
        <h3 className="mb-3 text-base font-semibold text-neutral-900 md:text-[15px]">{title}</h3>
      ) : null}
      {children}
      {last ? footer : null}
    </section>
  );
  if (!first) return body;
  return (
    <ComposeWizardStepChrome title={pageSteps.length > 1 ? pageTitle : title} onClose={onClose} onBack={onBack}>
      {body}
    </ComposeWizardStepChrome>
  );
};
