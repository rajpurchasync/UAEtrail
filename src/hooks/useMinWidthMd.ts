import { useEffect, useState } from 'react';
import { DESKTOP_MIN_WIDTH_PX } from '../config/desktopNav';

/** Matches product desktop chrome (`md:` / side nav) — {@link DESKTOP_MIN_WIDTH_PX}px. */
export const useMinWidthMd = (): boolean => {
  const query = `(min-width: ${DESKTOP_MIN_WIDTH_PX}px)`;
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
};
