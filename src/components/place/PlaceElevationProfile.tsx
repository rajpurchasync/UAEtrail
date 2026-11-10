type Props = {
  profile: [number, number][];
  className?: string;
};

/** Simple elevation vs distance polyline for trail preview (no axes — companion to map). */
export const PlaceElevationProfile = ({ profile, className }: Props) => {
  if (profile.length < 2) return null;

  const distances = profile.map((p) => p[0]);
  const elevations = profile.map((p) => p[1]);
  const minD = Math.min(...distances);
  const maxD = Math.max(...distances);
  const minEl = Math.min(...elevations);
  const maxEl = Math.max(...elevations);
  const spanD = maxD - minD || 1;
  const spanEl = maxEl - minEl || 1;

  const w = 320;
  const h = 80;
  const pad = 4;

  const points = profile
    .map(([d, el]) => {
      const x = pad + ((d - minD) / spanD) * (w - pad * 2);
      const y = h - pad - ((el - minEl) / spanEl) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const label = `${Math.round(minEl)}–${Math.round(maxEl)} m elevation`;

  return (
    <div className={className}>
      <p className="mb-1 text-xs font-medium text-neutral-500">{label}</p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full max-h-24 text-emerald-600"
        preserveAspectRatio="none"
        aria-hidden
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
      </svg>
    </div>
  );
};
