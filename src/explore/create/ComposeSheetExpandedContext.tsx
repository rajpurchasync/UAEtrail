import { useEffect, type ReactNode } from 'react';
import { ComposeDiscardConfirmHost } from '../ui/ComposeDiscardConfirmHost';
import { useComposeImmersiveChrome } from './ComposeImmersiveChromeContext';

/** Compose session: host discard confirm; full chrome hide only during wizards (not picker modals). */
export const ComposeSheetExpandedProvider = ({
  composeSessionOpen: _composeSessionOpen,
  immersiveWizardOpen = false,
  children,
}: {
  /** Any compose overlay open — reserved for shared hosts (discard confirm). */
  composeSessionOpen: boolean;
  /** Multi-step FAB wizard — hide mobile tab header and bottom nav. */
  immersiveWizardOpen?: boolean;
  children: ReactNode;
}) => {
  const { setImmersiveCompose } = useComposeImmersiveChrome();

  useEffect(() => {
    setImmersiveCompose(immersiveWizardOpen);
    return () => setImmersiveCompose(false);
  }, [immersiveWizardOpen, setImmersiveCompose]);

  return (
    <>
      {children}
      <ComposeDiscardConfirmHost />
    </>
  );
};
