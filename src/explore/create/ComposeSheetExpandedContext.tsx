import { useEffect, type ReactNode } from 'react';
import { ComposeDiscardConfirmHost } from '../ui/ComposeDiscardConfirmHost';
import { useComposeImmersiveChrome } from './ComposeImmersiveChromeContext';

/** Compose session: hide map tab chrome on mobile and host discard confirm. */
export const ComposeSheetExpandedProvider = ({
  composeSessionOpen,
  children,
}: {
  composeSessionOpen: boolean;
  children: ReactNode;
}) => {
  const { setImmersiveCompose } = useComposeImmersiveChrome();

  useEffect(() => {
    setImmersiveCompose(composeSessionOpen);
    return () => setImmersiveCompose(false);
  }, [composeSessionOpen, setImmersiveCompose]);

  return (
    <>
      {children}
      <ComposeDiscardConfirmHost />
    </>
  );
};
