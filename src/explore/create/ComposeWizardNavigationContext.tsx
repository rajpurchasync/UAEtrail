import { createContext, useContext } from 'react';

const ComposeWizardNavigationContext = createContext(false);

export const ComposeWizardNavigationProvider = ComposeWizardNavigationContext.Provider;

/** True when the current wizard was opened from the FAB compose menu (not a deep link). */
export const useComposeWizardEnteredFromMenu = (): boolean =>
  useContext(ComposeWizardNavigationContext);
