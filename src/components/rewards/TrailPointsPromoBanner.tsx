import { Link } from 'react-router-dom';
import { ChevronRight, Trophy } from 'lucide-react';

interface TrailPointsPromoBannerProps {
  variant?: 'home' | 'community' | 'compact';
  className?: string;
}

const BANNER_COPY = {
  home: {
    line1: 'Do what you love outdoors.',
    line1Accent: 'Feel recognized for it.',
    line2: 'Hike, camp, contribute — joy first, rewards follow naturally.',
  },
  community: {
    line1: 'Share because it feels good.',
    line1Accent: 'Get rewarded when you do.',
    line2: 'Your post helps someone — and earns you points too.',
  },
  compact: {
    line1: 'Show up for what you love.',
    line1Accent: 'Rewards follow.',
    line2: 'Hikers & campers who give back, get back.',
  },
} as const;

/** Promo strip → /trail-points */
export const TrailPointsPromoBanner = ({ variant = 'home', className = '' }: TrailPointsPromoBannerProps) => {
  const copy = BANNER_COPY[variant === 'community' ? 'community' : variant === 'compact' ? 'compact' : 'home'];
  const isHome = variant === 'home';
  const isCompact = variant === 'compact';

  const outerClass = isHome
    ? `px-4 sm:px-6 lg:px-8 -mt-3 relative z-20 ${className}`
    : className;

  const padClass = isCompact ? 'px-3.5 py-3' : 'px-4 py-3.5 sm:px-5 sm:py-4';

  return (
    <div className={outerClass}>
      <Link
        to="/trail-points"
        className={`rewards-promo-banner group block ${isHome ? 'max-w-7xl mx-auto' : ''} rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-50 via-[#eef8f4] to-teal-50/90 ring-1 ring-emerald-200/70 shadow-sm active:scale-[0.985] transition-transform duration-200`}
      >
        <div className={`relative flex items-center gap-3 sm:gap-4 ${padClass}`}>
          <span
            className={`flex shrink-0 ${isCompact ? 'h-10 w-10' : 'h-11 w-11 sm:h-12 sm:w-12'} items-center justify-center rounded-xl bg-white ring-1 ring-emerald-200/80 shadow-sm`}
          >
            <Trophy
              className={`${isCompact ? 'h-5 w-5' : 'h-6 w-6'} text-amber-500 fill-amber-400/20`}
              strokeWidth={2}
              aria-hidden
            />
          </span>

          <div className="min-w-0 flex-1">
            <p
              className={`font-extrabold text-emerald-950 tracking-tight leading-snug ${
                isCompact ? 'text-[15px]' : 'text-[15px] sm:text-base'
              }`}
            >
              {copy.line1}{' '}
              <span className="text-teal-700">{copy.line1Accent}</span>
            </p>
            <p className="text-xs sm:text-[13px] font-medium text-emerald-800/80 mt-0.5 leading-relaxed">
              {copy.line2}
            </p>
          </div>

          <span className="shrink-0 inline-flex items-center gap-0.5 text-xs sm:text-sm font-bold text-emerald-700 group-hover:text-emerald-900">
            Learn more
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden />
          </span>
        </div>
      </Link>
    </div>
  );
};
