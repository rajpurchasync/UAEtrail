import { Link } from 'react-router-dom';
import { LLMS_TXT_PATH } from '../../../config/seo';

export interface HomeFooterLink {
  label: string;
  href: string;
}

export interface HomeFooterFounderNote {
  quote: string;
  attributions: readonly { name: string; role: string }[];
}

export interface HomeMarketingFooterProps {
  links: HomeFooterLink[];
  founderNote?: HomeFooterFounderNote;
}

const isInternal = (href: string) => href.startsWith('/');

export const HomeMarketingFooter = ({ links, founderNote }: HomeMarketingFooterProps) => (
  <footer className="home-v2-font border-t border-[var(--gray-200)] bg-home-surface">
    <div className="mx-auto max-w-[var(--content-max-width)] px-[var(--gutter-mobile)] py-6 text-center md:px-[var(--gutter-desktop)] md:py-8">
      {founderNote ? (
        <div className="mb-4 space-y-1">
          <p className="text-[12px] italic leading-snug text-home-ink/50 md:text-[13px]">
            &ldquo;{founderNote.quote}&rdquo;
          </p>
          {founderNote.attributions.map((person) => (
            <p key={person.role} className="text-[11px] font-medium text-home-ink/55 md:text-[12px]">
              {person.name}, {person.role}
            </p>
          ))}
        </div>
      ) : null}

      {links.length > 0 ? (
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {links.map((link) => (
              <li key={link.label}>
                {isInternal(link.href) ? (
                  <Link
                    to={link.href}
                    className="home-focus-ring text-[12px] font-medium text-home-ink/65 transition hover:text-home-green-600"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    href={link.href}
                    className="home-focus-ring text-[12px] font-medium text-home-ink/65 transition hover:text-home-green-600"
                  >
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <p className="mt-3 text-[11px] leading-relaxed text-home-ink/45">
        <a href={LLMS_TXT_PATH} className="home-focus-ring underline-offset-2 hover:text-home-green-600 hover:underline">
          llms.txt
        </a>
        {' '}
        for AI assistants — machine-readable site summary
      </p>
      <p className="mt-2 text-[11px] text-home-ink/40">© 2026 UAE Trail</p>
    </div>
  </footer>
);
