import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ComposeImmersiveChromeContextValue = {
  immersiveCompose: boolean;
  setImmersiveCompose: (active: boolean) => void;
};

const ComposeImmersiveChromeContext = createContext<ComposeImmersiveChromeContextValue | null>(
  null
);

/** FAB compose full-screen — transparent product header + no bottom tab bar. */
export const ComposeImmersiveChromeProvider = ({ children }: { children: ReactNode }) => {
  const [immersiveCompose, setImmersiveComposeState] = useState(false);
  const setImmersiveCompose = useCallback((active: boolean) => {
    setImmersiveComposeState(active);
  }, []);
  const value = useMemo(
    () => ({ immersiveCompose, setImmersiveCompose }),
    [immersiveCompose, setImmersiveCompose]
  );
  return (
    <ComposeImmersiveChromeContext.Provider value={value}>
      {children}
    </ComposeImmersiveChromeContext.Provider>
  );
};

export const useComposeImmersiveChrome = (): ComposeImmersiveChromeContextValue => {
  const ctx = useContext(ComposeImmersiveChromeContext);
  if (!ctx) {
    return { immersiveCompose: false, setImmersiveCompose: () => {} };
  }
  return ctx;
};
