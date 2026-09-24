import { useEffect, useState } from 'react';

/** Matches Tailwind `lg:` breakpoint (1024px). */
export const useMinWidthLg = (): boolean => {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return matches;
};
