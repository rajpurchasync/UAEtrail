import { createContext, useContext, type ReactNode } from 'react';
import { FlowSheetChrome } from '../ExploreFlowSheetChrome';
import { HostingWizardNextButton } from './HostingWizardNextButton';

const HostingWizardEmbedContext = createContext(false);

export const HostingWizardEmbedProvider = ({
  embedded,
  children,
}: {
  embedded: boolean;
  children: ReactNode;
}) => (
  <HostingWizardEmbedContext.Provider value={embedded}>{children}</HostingWizardEmbedContext.Provider>
);

type HostingWizardChromeProps = {
  title: string;
  onClose: () => void;
  onBack: () => void;
  children: ReactNode;
};

/** Standard organize step sheet — title bar + scrollable body (use StepError / StepFooter inside). */
export const HostingWizardChrome = ({ title, onClose, onBack, children }: HostingWizardChromeProps) => {
  const embedded = useContext(HostingWizardEmbedContext);
  if (embedded) return <>{children}</>;
  return (
    <FlowSheetChrome title={title} onClose={onClose} onBack={onBack}>
      {children}
    </FlowSheetChrome>
  );
};

export const HostingWizardStepError = ({ error }: { error?: string | null }) => {
  const embedded = useContext(HostingWizardEmbedContext);
  if (embedded) return null;
  return error ? (
    <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
  ) : null;
};

export const HostingWizardStepFooter = ({ children }: { children: ReactNode }) => (
  <div className="mt-5 pb-2 md:mt-3 md:pb-1">{children}</div>
);

export type HostingWizardNextProps = {
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

/** Footer primary action — wraps {@link HostingWizardNextButton}. */
export const HostingWizardStepNext = (props: HostingWizardNextProps) => {
  const embedded = useContext(HostingWizardEmbedContext);
  if (embedded) return null;
  return (
    <HostingWizardStepFooter>
      <HostingWizardNextButton {...props} />
    </HostingWizardStepFooter>
  );
};
