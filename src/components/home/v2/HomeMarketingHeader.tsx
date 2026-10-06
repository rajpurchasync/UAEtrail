import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { HOME_HEADER_NAV } from '../../../content/homeMarketing';
import { AppButtonLink } from '../../mobile/AppButton';

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

  const overHero = forceOverHero || !solid;

  const loginMobileClass = overHero
    ? 'home-focus-ring inline-flex min-h-10 items-center justify-center rounded-full border border-white/40 bg-white/10 px-4 text-[14px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/15'
    : 'home-focus-ring inline-flex min-h-10 items-center justify-center rounded-full px-4 text-[14px] font-semibold text-home-ink transition hover:bg-home-muted';

  const loginDesktopClass = overHero
    ? 'home-focus-ring rounded-home-sm px-3 py-2 text-[length:var(--text-sm)] font-medium text-white hover:bg-white/10'
    : 'home-focus-ring rounded-home-sm px-3 py-2 text-[length:var(--text-sm)] font-medium';

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
          <Link to={loginHref} className={`${loginMobileClass} md:hidden`}>
            {HOME_HEADER_NAV.login}
          </Link>
          <Link to={loginHref} className={`${loginDesktopClass} hidden md:inline-flex`}>
            {HOME_HEADER_NAV.login}
          </Link>
          <AppButtonLink
            to={signupHref}
            variant={overHero ? 'inverse' : 'primary'}
            className="min-h-10 px-4 text-[14px]"
          >
            {HOME_HEADER_NAV.signup}
          </AppButtonLink>
        </div>
      </div>
    </header>
  );
};
