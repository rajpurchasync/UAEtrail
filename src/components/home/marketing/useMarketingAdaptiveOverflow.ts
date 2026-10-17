import { useLayoutEffect, useState, type RefObject } from 'react';

/** True when flex children at min-width exceed the track width (desktop/tablet). */
export function useMarketingAdaptiveOverflow(
  trackRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  resetWhen: unknown[]
) {
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    if (!enabled) {
      setOverflows(false);
      return;
    }

    const el = trackRef.current;
    if (!el) return;

    const measure = () => {
      setOverflows(el.scrollWidth > el.clientWidth + 2);
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller reset keys
  }, [enabled, trackRef, ...resetWhen]);

  return overflows;
}
