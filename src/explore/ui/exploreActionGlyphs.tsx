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
    className={
      className.trim()
        ? `block shrink-0 overflow-visible ${className}`
        : 'block h-[1.15em] w-[1.15em] shrink-0 overflow-visible'
    }
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

/** Trail / hiking — same mountain as map venue pins, with a white edge. */
export const HikingVenueGlyph = ({ className = '' }: { className?: string }) => (
  <svg
    className={`explore-hiking-glyph uaetrail-venue-glyph block h-[1.15em] w-[1.15em] shrink-0 overflow-visible text-emerald-700 ${className}`}
    viewBox="0 0 24 24"
    aria-hidden
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#047857"
      d="M2.5 19.5 8.2 9.8 11.5 14.2 15.8 7.5 21.5 19.5z"
    />
    <path
      fill="none"
      stroke="#fff"
      strokeWidth={2.4}
      strokeLinejoin="round"
      d="M2.5 19.5 8.2 9.8 11.5 14.2 15.8 7.5 21.5 19.5"
    />
    <path
      fill="none"
      stroke="#047857"
      strokeWidth={1.15}
      strokeLinejoin="round"
      d="M2.5 19.5 8.2 9.8 11.5 14.2 15.8 7.5 21.5 19.5"
    />
    <circle cx={15.8} cy={7.5} r={1.45} fill="#fff" />
    <circle cx={15.8} cy={7.5} r={0.85} fill="#047857" />
  </svg>
);

/** Amenities — toilets, water, rest areas. */
export const FacilityGlyph = ({ className }: { className?: string }) => (
  <GlyphFrame className={`explore-facility-glyph ${className}`}>
    <circle cx="8.1" cy="5.6" r="2.15" fill="#1d4ed8" stroke="#fff" strokeWidth="1.1" />
    <path
      fill="#1d4ed8"
      stroke="#fff"
      strokeWidth="1.1"
      strokeLinejoin="round"
      d="M8.1 8.5c-2.55 0-4.35 1.45-4.35 3.35v6.15h2.2v-4.05h4.3v4.05h2.2v-6.15c0-1.9-1.8-3.35-4.35-3.35Z"
    />
    <path
      fill="#f59e0b"
      stroke="#fff"
      strokeWidth="1.1"
      strokeLinejoin="round"
      d="M17.15 9.1c0 1.85-1.45 3.35-3.2 3.35-1.75 0-3.2-1.5-3.2-3.35 0-2.05 3.2-5.55 3.2-5.55s3.2 3.5 3.2 5.55Z"
    />
    <circle cx="13.95" cy="9.35" r="1.05" fill="#fff" />
  </GlyphFrame>
);

/** Others — three colored dots, shared by Events and Places. */
export const OtherPlaceGlyph = ({ className }: { className?: string }) => (
  <GlyphFrame className={`explore-other-glyph ${className}`}>
    <circle cx="7.4" cy="7.6" r="4.35" fill="#10b981" stroke="#fff" strokeWidth="1.25" />
    <circle cx="16.7" cy="8.1" r="3.85" fill="#0ea5e9" stroke="#fff" strokeWidth="1.25" />
    <circle cx="12" cy="16.5" r="4.55" fill="#8b5cf6" stroke="#fff" strokeWidth="1.25" />
    <circle cx="7.4" cy="7.6" r="1.35" fill="#ecfdf5" />
    <circle cx="16.7" cy="8.1" r="1.2" fill="#e0f2fe" />
    <circle cx="12" cy="16.5" r="1.4" fill="#f5f3ff" />
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
