import { lazy, Suspense, useEffect, useRef, useState } from 'react';

const MeetingPointMapLazy = lazy(() =>
  import('../../components/ui/MeetingPointMap').then((m) => ({ default: m.MeetingPointMap }))
);

type Props = {
  lat: number;
  lng: number;
  label?: string | null;
  hideExternalLink?: boolean;
  showStyleToggle?: boolean;
};

const PinPlaceholder = ({ onActivate }: { onActivate: () => void }) => (
  <button
    type="button"
    onClick={onActivate}
    className="relative flex min-h-[9.5rem] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-neutral-800 text-white"
    aria-label="Show map"
  >
    <span
      className="absolute start-1/2 top-[42%] h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-600 shadow-lg rtl:translate-x-1/2"
      aria-hidden
    />
    <span className="relative mt-12 text-xs font-semibold">Tap to load map</span>
  </button>
);

/** Static CSS pin first; Leaflet MeetingPointMap loads on viewport or tap (plan §15.3). */
export const LazyMeetingPointMap = ({ lat, lng, label, hideExternalLink, showStyleToggle }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (load) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [load]);

  return (
    <div ref={ref} data-lazy-meeting-map>
      {load ? (
        <Suspense fallback={<div className="min-h-[9.5rem] animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />}>
          <MeetingPointMapLazy
            lat={lat}
            lng={lng}
            label={label}
            hideExternalLink={hideExternalLink}
            showStyleToggle={showStyleToggle}
          />
        </Suspense>
      ) : (
        <PinPlaceholder onActivate={() => setLoad(true)} />
      )}
    </div>
  );
};
