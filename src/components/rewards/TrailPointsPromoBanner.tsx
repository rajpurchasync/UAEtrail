import { Link } from 'react-router-dom';
import { Award, ChevronRight, Trophy } from 'lucide-react';

interface TrailPointsPromoBannerProps {
  variant?: 'home' | 'community' | 'compact';
  className?: string;
}

const BANNER_COPY = {
  community: {
    line1: 'Share because it feels good.',
    line1Accent: 'Get rewarded when you do.',
    line2: 'Your post helps someone — and earns you points too.',
    cta: 'Learn more',
  },
  compact: {
    line1: 'Earn Trail Points',
    line1Accent: 'for hikes, trips & community.',
    line2: '',
    cta: 'See rewards',
  },
} as const;

/** Promo strip → /trail-points */
export const TrailPointsPromoBanner = ({ variant = 'home', className = '' }: TrailPointsPromoBannerProps) => {
  const isHome = variant === 'home';
  const isCompact = variant === 'compact';
  const copy = !isHome ? BANNER_COPY[variant === 'community' ? 'community' : 'compact'] : null;

  if (isHome) {
    return (
      <div className={`border-b border-gray-200 bg-white ${className}`}>
        <Link
          to="/trail-points"
          className="rewards-promo-banner flex items-center justify-center gap-2 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 text-center text-sm sm:text-base text-gray-800 hover:text-gray-900 transition-colors"
        >
          <Award className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-amber-500 shrink-0" strokeWidth={2} aria-hidden />
          <span>
            Be the leader in what you love and{' '}
            <span className="font-semibold text-emerald-600">collect points</span>
          </span>
        </Link>
      </div>
    );
  }

  const outerClass = className;
  const padClass = isCompact ? 'px-3.5 py-2.5' : 'px-4 py-4 sm:px-6 sm:py-5';

  return (
    <div className={outerClass}>
      <Link
        to="/trail-points"
        className={`rewards-promo-banner group block max-w-7xl mx-auto rounded-2xl overflow-hidden ${
          isCompact
            ? 'bg-emerald-50/80 ring-1 ring-emerald-100'
            : 'bg-gradient-to-r from-emerald-100 via-emerald-50 to-teal-50 ring-2 ring-emerald-300/60 shadow-md shadow-emerald-900/10 hover:shadow-lg hover:ring-emerald-400/70'
        } transition-colors`}
      >
        <div className={`relative flex items-center gap-2.5 sm:gap-3 ${padClass}`}>
          <Trophy
            className={`shrink-0 ${isCompact ? 'h-4 w-4' : 'h-5 w-5 sm:h-6 sm:w-6'} text-amber-500`}
            strokeWidth={2}
            aria-hidden
          />

          <div className="min-w-0 flex-1">
            <p
              className={
                isCompact
                  ? 'font-medium text-[13px] sm:text-sm text-emerald-950 tracking-tight leading-snug'
                  : 'font-bold text-base sm:text-lg text-emerald-950 tracking-tight leading-snug'
              }
            >
              <span className="sm:hidden">
                {copy!.line1}
                {copy!.line1Accent && (
                  <>
                    <br />
                    <span className="text-emerald-700">{copy!.line1Accent}</span>
                  </>
                )}
              </span>
              <span className="hidden sm:inline">
                {copy!.line1}
                {copy!.line1Accent && (
                  <>
                    {' '}
                    <span className="text-emerald-700">{copy!.line1Accent}</span>
                  </>
                )}
              </span>
            </p>
            {!isCompact && copy!.line2 && (
              <p className="text-xs sm:text-sm font-medium text-emerald-900/75 mt-1 leading-relaxed">{copy!.line2}</p>
            )}
          </div>

          <span className="shrink-0 inline-flex items-center gap-0.5 text-xs sm:text-sm font-semibold text-emerald-700 group-hover:text-emerald-900 group-hover:underline underline-offset-2">
            <span>{copy!.cta}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden />
          </span>
        </div>
      </Link>
    </div>
  );
};
