import type { ReactNode } from 'react';
import { FlowSheetChrome } from '../ExploreFlowSheetChrome';
import { OrganizeWizardNextButton } from './OrganizeWizardNextButton';

type OrganizeWizardChromeProps = {
  title: string;
  onClose: () => void;
  onBack: () => void;
  children: ReactNode;
};

/** Standard organize step sheet — title bar + scrollable body (use StepError / StepFooter inside). */
export const OrganizeWizardChrome = ({ title, onClose, onBack, children }: OrganizeWizardChromeProps) => (
  <FlowSheetChrome title={title} onClose={onClose} onBack={onBack}>
    {children}
  </FlowSheetChrome>
);

export const OrganizeWizardStepError = ({ error }: { error?: string | null }) =>
  error ? (
    <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
  ) : null;

export const OrganizeWizardStepFooter = ({ children }: { children: ReactNode }) => (
  <div className="mt-5 pb-2">{children}</div>
);

export type OrganizeWizardNextProps = {
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

/** Footer primary action — wraps {@link OrganizeWizardNextButton}. */
export const OrganizeWizardStepNext = (props: OrganizeWizardNextProps) => (
  <OrganizeWizardStepFooter>
    <OrganizeWizardNextButton {...props} />
  </OrganizeWizardStepFooter>
);
