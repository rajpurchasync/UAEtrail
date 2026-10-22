import { useCallback, useEffect, useState } from 'react';

export const MOBILE_BROWSE_SHEET_EXPAND_HINT = 'Pull down to close · Pull up for full screen';

/** Full-screen step for mobile explore browse sheets (pull up on handle). */
export const useMobileBrowseSheetImmersive = (sheetOpen: boolean) => {
  const [immersive, setImmersive] = useState(false);

  useEffect(() => {
    if (!sheetOpen) setImmersive(false);
  }, [sheetOpen]);

  const enterImmersive = useCallback(() => setImmersive(true), []);
  const exitImmersive = useCallback(() => setImmersive(false), []);

  return { immersive, enterImmersive, exitImmersive };
};
