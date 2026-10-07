import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { HOME_HEADER_NAV } from '../../../content/homeMarketing';
import { AppButtonLink } from '../../mobile/AppButton';

/** Hero signup counts as on-screen only when most of the control is visible (not a clipped sliver). */
const isHeroSignupMeaningfullyVisible = (entry: IntersectionObserverEntry) => {
  if (!entry.isIntersecting) return false;
  const { height } = entry.boundingClientRect;
  if (height <= 0) return false;
  const visiblePx =
    Math.min(entry.boundingClientRect.bottom, window.innerHeight) -
    Math.max(entry.boundingClientRect.top, 0);
  const minVisible = Math.min(44, height * 0.55);
  return visiblePx >= minVisible || entry.intersectionRatio >= 0.55;
};

export interface HomeMarketingHeaderLink {
  label: string;
  href: string;
}

export interface HomeMarketingHeaderProps {
  navLinks?: HomeMarketingHeaderLink[];
  loginHref: string;
  signupHref: string;
  /** When true, keeps transparent-on-hero styling (e.g. hero overlay demos). */
  forceOverHero?: boolean;
}

export const HomeMarketingHeader = ({
  navLinks = [],
  loginHref,
  signupHref,
  forceOverHero = false
}: HomeMarketingHeaderProps) => {
  const [solid, setSolid] = useState(!forceOverHero);
  /** Hide header signup CTA while the hero signup control is on screen (avoids duplicate CTAs). */
  const [heroSignupInView, setHeroSignupInView] = useState(true);

  useEffect(() => {
    if (forceOverHero) {
      setSolid(false);
      return;
    }
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [forceOverHero]);

  useEffect(() => {
    const heroSignup = document.getElementById('home-hero-signup-cta');
    if (!heroSignup) {
      setHeroSignupInView(false);
      return;
    }
    const syncFromRect = () => {
      const rect = heroSignup.getBoundingClientRect();
      const visiblePx = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      const minVisible = Math.min(44, rect.height * 0.55);
      const ratio = rect.height > 0 ? visiblePx / rect.height : 0;
      setHeroSignupInView(visiblePx >= minVisible || ratio >= 0.55);
    };

    syncFromRect();

    const observer = new IntersectionObserver(
      ([entry]) => setHeroSignupInView(isHeroSignupMeaningfullyVisible(entry)),
      { threshold: [0, 0.25, 0.55, 0.75, 1] }
    );
    observer.observe(heroSignup);
    window.addEventListener('resize', syncFromRect, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncFromRect);
    };
  }, []);

  const overHero = forceOverHero || !solid;

  const loginOverHeroClass =
    'home-focus-ring inline-flex min-h-10 items-center justify-center rounded-full border border-white/40 bg-white/10 px-4 text-[14px] font-semibold text-white shadow-sm shadow-black/10 backdrop-blur-md transition hover:bg-white/15 md:text-[length:var(--text-sm)]';

  const loginSolidClass =
    'home-focus-ring inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--gray-200)] bg-home-surface px-4 text-[14px] font-semibold text-home-ink shadow-sm transition hover:bg-home-muted md:text-[length:var(--text-sm)]';

  return (
    <header
      className={[
        'home-v2-font sticky top-0 z-50 transition-[background-color,box-shadow,color] duration-[var(--duration-ui)]',
        overHero ? 'bg-transparent text-white' : 'bg-home-surface text-home-ink shadow-home-header'
      ].join(' ')}
    >
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-home-surface focus:px-3 focus:py-2 focus:text-home-ink">
        Skip to main content
      </a>
      <div
        className="mx-auto flex h-[var(--header-height-mobile)] max-w-[var(--content-max-width)] items-center justify-between px-[var(--gutter-mobile)] md:h-[var(--header-height-desktop)] md:px-[var(--gutter-desktop)]"
      >
        <Link to="/" className="home-focus-ring flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-lg shadow-emerald-900/30"
            aria-hidden
          >
            <Mountain className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">UAE Trail</span>
        </Link>

        {navLinks.length > 0 ? (
          <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="home-focus-ring text-[length:var(--text-sm)] font-medium hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="flex items-center gap-2 md:ml-auto md:gap-3">
          <Link
            to={loginHref}
            className={overHero ? loginOverHeroClass : loginSolidClass}
          >
            {HOME_HEADER_NAV.login}
          </Link>
          {!heroSignupInView ? (
            <AppButtonLink
              to={signupHref}
              variant="primary"
              className="min-h-10 px-4 text-[14px]"
            >
              {HOME_HEADER_NAV.signup}
            </AppButtonLink>
          ) : null}
        </div>
      </div>
    </header>
  );
};
