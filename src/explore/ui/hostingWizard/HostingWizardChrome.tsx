import type { ReactNode } from 'react';
import { FlowSheetChrome } from '../ExploreFlowSheetChrome';
import { HostingWizardNextButton } from './HostingWizardNextButton';

type HostingWizardChromeProps = {
  title: string;
  onClose: () => void;
  onBack: () => void;
  children: ReactNode;
};

/** Standard organize step sheet — title bar + scrollable body (use StepError / StepFooter inside). */
export const HostingWizardChrome = ({ title, onClose, onBack, children }: HostingWizardChromeProps) => (
  <FlowSheetChrome title={title} onClose={onClose} onBack={onBack}>
    {children}
  </FlowSheetChrome>
);

export const HostingWizardStepError = ({ error }: { error?: string | null }) =>
  error ? (
    <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
  ) : null;

export const HostingWizardStepFooter = ({ children }: { children: ReactNode }) => (
  <div className="mt-5 pb-2">{children}</div>
);

export type HostingWizardNextProps = {
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

/** Footer primary action — wraps {@link HostingWizardNextButton}. */
export const HostingWizardStepNext = (props: HostingWizardNextProps) => (
  <HostingWizardStepFooter>
    <HostingWizardNextButton {...props} />
  </HostingWizardStepFooter>
);
