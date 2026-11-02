import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Mountain, Sun } from 'lucide-react';
import { HOME_HEADER_NAV } from '../../../content/homeMarketing';
import {
  DISPLAY_PREFERENCES_EVENT,
  readGuestTheme,
  resolveTheme,
  writeGuestTheme,
} from '../../../preferences/displayPreferences';
import { AppButtonLink } from '../../mobile/AppButton';

export interface HomeMarketingHeaderLink {
  label: string;
  href: string;
}

export interface HomeMarketingHeaderProps {
  navLinks?: HomeMarketingHeaderLink[];
  signupHref: string;
}

export const HomeMarketingHeader = ({
  navLinks = [],
  signupHref
}: HomeMarketingHeaderProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [guestDark, setGuestDark] = useState(() => resolveTheme(readGuestTheme()) === 'dark');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sync = () => setGuestDark(document.documentElement.dataset.theme === 'dark');
    sync();
    window.addEventListener(DISPLAY_PREFERENCES_EVENT, sync);
    return () => window.removeEventListener(DISPLAY_PREFERENCES_EVENT, sync);
  }, []);

  const switchGuestTheme = () => {
    const next = guestDark ? 'light' : 'dark';
    writeGuestTheme(next);
    setGuestDark(next === 'dark');
  };

  return (
    <header
      className={[
        'home-marketing-header home-v2-font sticky top-0 z-50 bg-transparent',
        scrolled ? 'is-scrolled text-home-ink' : 'text-white'
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

        <div className="flex items-center gap-2 md:ml-auto">
          <button
            type="button"
            className="home-focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-current/25 bg-black/25 text-current backdrop-blur-md"
            aria-label={guestDark ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={guestDark}
            onClick={switchGuestTheme}
          >
            {guestDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <AppButtonLink
            id="home-header-signup-cta"
            to={signupHref}
            variant="primary"
            className="min-h-10 px-4 text-[14px] font-bold shadow-lg shadow-black/20 md:px-5"
          >
            {HOME_HEADER_NAV.signup}
          </AppButtonLink>
        </div>
      </div>
    </header>
  );
};
