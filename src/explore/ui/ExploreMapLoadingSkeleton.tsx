const GHOST_PINS: Array<{
  top: string;
  left: string;
  place: boolean;
  delay: string;
}> = [
  { top: '32%', left: '22%', place: false, delay: '0ms' },
  { top: '40%', left: '48%', place: true, delay: '140ms' },
  { top: '28%', left: '68%', place: false, delay: '260ms' },
  { top: '54%', left: '30%', place: true, delay: '80ms' },
  { top: '58%', left: '62%', place: false, delay: '200ms' },
  { top: '46%', left: '78%', place: true, delay: '320ms' },
  { top: '66%', left: '44%', place: false, delay: '160ms' },
];

/** Ghost outing pins and place chips while the catalog is still empty. The basemap stays visible. */
export const ExploreMapLoadingSkeleton = () => (
  <div
    className="pointer-events-none absolute inset-0 z-[1000]"
    role="status"
    aria-live="polite"
    aria-label="Loading the map"
  >
    {GHOST_PINS.map((pin) => (
      <div
        key={`${pin.top}-${pin.left}`}
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ top: pin.top, left: pin.left }}
      >
        {pin.place ? (
          <div className="flex animate-pulse items-center gap-1.5" style={{ animationDelay: pin.delay }}>
            <span className="h-9 w-9 rounded-[10px] border border-white/90 bg-white/85 shadow-[0_2px_8px_rgba(15,23,42,0.28)]" />
            <span className="h-4 w-16 rounded-md bg-white/80 shadow-sm" />
          </div>
        ) : (
          <span className="relative block h-8 w-8" style={{ animationDelay: pin.delay }}>
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" style={{ animationDelay: pin.delay }} />
            <span
              className="absolute inset-0 animate-pulse rounded-full border-[3px] border-emerald-600/90 bg-white/90 shadow-[0_2px_8px_rgba(15,23,42,0.28)]"
              style={{ animationDelay: pin.delay }}
            />
          </span>
        )}
      </div>
    ))}
  </div>
);
