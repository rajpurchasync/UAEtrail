/** Map-area loading skeleton — replaces spinner-only state. */
export const ExploreMapLoadingSkeleton = () => (
  <div
    className="absolute inset-0 z-[1000] animate-pulse bg-[#e8f0ec]"
    aria-hidden
  >
    <div className="absolute inset-0 opacity-60" style={{
      backgroundImage:
        'radial-gradient(circle at 25% 30%, rgba(16,185,129,.2), transparent 42%), radial-gradient(circle at 70% 55%, rgba(59,130,246,.15), transparent 38%)',
    }} />
    <div className="absolute left-[20%] top-[32%] h-3 w-3 rounded-full bg-emerald-400/70" />
    <div className="absolute left-[55%] top-[48%] h-2.5 w-2.5 rounded-full bg-amber-400/70" />
    <div className="absolute left-[38%] top-[62%] h-2.5 w-2.5 rounded-full bg-sky-400/70" />
    <div className="absolute inset-x-0 bottom-[30%] flex justify-center">
      <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-neutral-600 shadow-sm">
        Loading map…
      </span>
    </div>
  </div>
);
