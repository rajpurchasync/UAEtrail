import { createContext, useContext, type ReactNode } from 'react';

const ComposeWizardItemEmojiContext = createContext<string | undefined>(undefined);

/** Wizard-wide item emoji for the compact compose top bar. */
export const ComposeWizardItemProvider = ({
  emoji,
  children,
}: {
  emoji: string;
  children: ReactNode;
}) => (
  <ComposeWizardItemEmojiContext.Provider value={emoji}>
    {children}
  </ComposeWizardItemEmojiContext.Provider>
);

export const useComposeWizardItemEmoji = (): string | undefined =>
  useContext(ComposeWizardItemEmojiContext);
