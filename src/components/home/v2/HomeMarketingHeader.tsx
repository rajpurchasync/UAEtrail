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
  signupHref: string;
  /** When true, keeps transparent-on-hero styling (e.g. hero overlay demos). */
  forceOverHero?: boolean;
}

export const HomeMarketingHeader = ({
  navLinks = [],
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
        className="home-marketing-wrap flex h-[var(--header-height-mobile)] items-center justify-between md:h-[var(--header-height-desktop)]"
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

        <div className="flex items-center md:ml-auto">
          <AppButtonLink
            id="home-header-signup-cta"
            to={signupHref}
            variant="primary"
            className="min-h-10 px-4 text-[14px] shadow-lg shadow-black/20 md:px-5"
          >
            {HOME_HEADER_NAV.signup}
          </AppButtonLink>
        </div>
      </div>
    </header>
  );
};
