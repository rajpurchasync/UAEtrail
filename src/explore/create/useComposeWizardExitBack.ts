import { useCallback } from 'react';
import { useComposeWizardEnteredFromMenu } from './ComposeWizardNavigationContext';

/** First-step / exit back: submenu when opened from menu, else close compose (with discard confirm). */
export const useComposeWizardExitBack = (
  requestClose: () => void,
  onBackToIntent?: () => void
): (() => void) => {
  const enteredFromMenu = useComposeWizardEnteredFromMenu();
  return useCallback(() => {
    if (enteredFromMenu && onBackToIntent) {
      onBackToIntent();
      return;
    }
    requestClose();
  }, [enteredFromMenu, onBackToIntent, requestClose]);
};
