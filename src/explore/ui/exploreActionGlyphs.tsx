import type { ReactNode } from 'react';

const GlyphFrame = ({
  children,
  className = '',
  viewBox = '0 0 24 24',
}: {
  children: ReactNode;
  className?: string;
  viewBox?: string;
}) => (
  <svg
    viewBox={viewBox}
    className={`block h-[1.15em] w-[1.15em] shrink-0 overflow-visible ${className}`}
    aria-hidden
  >
    {children}
  </svg>
);

/** Spots / locations — a place pin, not the sun. */
export const LocationSpotGlyph = ({ className }: { className?: string }) => (
  <GlyphFrame className={className}>
    <path
      fill="#f43f5e"
      d="M12 1.8c-3.7 0-6.5 2.75-6.5 6.25 0 4.85 6.5 12.15 6.5 12.15s6.5-7.3 6.5-12.15C18.5 4.55 15.7 1.8 12 1.8Z"
    />
    <circle cx="12" cy="8" r="2.45" fill="#fff" />
    <circle cx="12" cy="8" r="1.2" fill="#0ea5e9" />
  </GlyphFrame>
);

/** Trail — one pine, a dotted path, and two place pins. */
export const TrailMapGlyph = ({ className }: { className?: string }) => (
  <GlyphFrame className={className} viewBox="0 0 32 32">
    <path
      d="M4 29.4c2.6-4.4 4-7.6 5.6-10.6 1.6-3 1.2-5 3.4-6.6 2.4-1.7 4.6-1.5 7-2.8 2.2-1.2 3.6-2.8 4.8-4.4"
      fill="none"
      stroke="#fb923c"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeDasharray="0.15 3.15"
    />
    <path
      d="M12.2 16.8c2.4 1.7 4.6 2.5 7.4 3.3 2.2.6 3.8 1.4 5.2 2.2"
      fill="none"
      stroke="#f59e0b"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeDasharray="0.15 3.05"
    />
    <path fill="#4ade80" d="M2.2 20.2 8.4 7.6 14.6 20.2Z" />
    <path fill="#16a34a" d="M3.6 15.4 8.4 5.4 13.2 15.4Z" />
    <path fill="#166534" d="M4.8 12.2 8.4 4.2 12 12.2Z" />
    <path fill="#92400e" d="M7.5 20h1.8v6.2H7.5z" />
    <path
      fill="#e11d48"
      d="M25.4 1.4c-2.2 0-3.8 1.65-3.8 3.65 0 2.8 3.8 6.7 3.8 6.7s3.8-3.9 3.8-6.7c0-2-1.6-3.65-3.8-3.65Z"
    />
    <circle cx="25.4" cy="5" r="1.25" fill="#fff" />
    <path
      fill="#0284c7"
      d="M24.2 17.4c-2.1 0-3.6 1.55-3.6 3.5 0 2.65 3.6 6.4 3.6 6.4s3.6-3.75 3.6-6.4c0-1.95-1.5-3.5-3.6-3.5Z"
    />
    <circle cx="24.2" cy="20.8" r="1.15" fill="#fff" />
  </GlyphFrame>
);

/** Others — three colored dots, shared by Events and Places. */
export const OtherPlaceGlyph = ({ className }: { className?: string }) => (
  <GlyphFrame className={className}>
    <circle cx="8.1" cy="8.2" r="3.15" fill="#34d399" />
    <circle cx="16.2" cy="8.6" r="2.7" fill="#38bdf8" />
    <circle cx="12" cy="16.35" r="3.35" fill="#a78bfa" />
    <circle cx="8.1" cy="8.2" r="1.15" fill="#ecfdf5" />
    <circle cx="16.2" cy="8.6" r="1" fill="#e0f2fe" />
    <circle cx="12" cy="16.35" r="1.2" fill="#f5f3ff" />
  </GlyphFrame>
);

export const CalendarGlyph = ({ className }: { className?: string }) => (
  <GlyphFrame className={className}>
    <rect x="3.8" y="5.4" width="16.4" height="14.6" rx="2.4" fill="#fff" stroke="#d1d5db" strokeWidth=".6" />
    <path fill="#10b981" d="M3.8 7.55h16.4v2.2H3.8z" />
    <path fill="#10b981" d="M6.2 5.4h11.6c1.3 0 2.4 1.1 2.4 2.4v2H3.8v-2c0-1.3 1.1-2.4 2.4-2.4Z" />
    <rect x="7.15" y="3.55" width="1.7" height="3.6" rx=".7" fill="#064e3b" />
    <rect x="15.15" y="3.55" width="1.7" height="3.6" rx=".7" fill="#064e3b" />
    <rect x="7.2" y="12.15" width="2.15" height="2.15" rx=".45" fill="#fbbf24" />
    <rect x="10.9" y="12.15" width="2.15" height="2.15" rx=".45" fill="#34d399" />
    <rect x="14.6" y="12.15" width="2.15" height="2.15" rx=".45" fill="#38bdf8" />
    <rect x="7.2" y="15.4" width="2.15" height="2.15" rx=".45" fill="#fb7185" />
    <rect x="10.9" y="15.4" width="2.15" height="2.15" rx=".45" fill="#a78bfa" />
  </GlyphFrame>
);
