import { Link, useLocation } from 'react-router-dom';
import { LLMS_TXT_PATH } from '../../config/seo';
import { HOME_FOOTER_FOUNDERS } from '../../content/homeMarketing';

const FOOTER_LINKS = [
  { label: 'About', to: '/about' },
  { label: 'Terms and Conditions', to: '/terms' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Privacy', to: '/privacy' }
] as const;

const linkClass = 'text-xs text-gray-400 transition-colors hover:text-emerald-400 sm:text-sm';

export const Footer = () => {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <footer className="bg-gray-900 text-gray-300 pb-safe">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center sm:px-6 lg:px-8 md:py-8">
        {isHome ? (
          <section
            className="home-v2-font mb-8 rounded-2xl border border-emerald-700/35 bg-gradient-to-b from-emerald-950/50 to-gray-900/80 px-5 py-6 text-left shadow-[inset_0_1px_0_rgba(52,211,153,0.12)] sm:px-6 md:mb-10 md:px-8 md:py-8"
            aria-labelledby="home-footer-founders-heading"
          >
            <p
              id="home-footer-founders-heading"
              className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-400 md:mb-6 md:text-xs"
            >
              Built by hikers who wanted a crew
            </p>
            <div className="grid gap-8 md:grid-cols-2 md:items-stretch md:gap-0">
              {HOME_FOOTER_FOUNDERS.map((person, index) => (
                <figure
                  key={person.name}
                  className={[
                    'mx-auto flex max-w-lg flex-col md:max-w-none md:px-6',
                    index === 1 ? 'md:border-l md:border-emerald-800/40' : ''
                  ].join(' ')}
                >
                  <blockquote className="flex-1 text-[15px] leading-relaxed text-gray-100 md:text-base md:leading-relaxed">
                    {person.lines.map((line, lineIndex) => (
                      <p key={lineIndex} className={lineIndex > 0 ? 'mt-3' : undefined}>
                        &ldquo;{line}&rdquo;
                      </p>
                    ))}
                  </blockquote>
                  <figcaption className="mt-4 shrink-0 text-sm text-emerald-100/90 md:mt-5 md:text-[15px]">
                    <span className="font-bold text-white">{person.name}</span>
                    <span className="text-emerald-200/80"> · {person.role}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-6">
            {FOOTER_LINKS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-4 text-[10px] leading-none text-gray-700">
          <a
            href={LLMS_TXT_PATH}
            className="transition-colors hover:text-gray-500"
            aria-label="Machine-readable site summary for AI assistants"
          >
            AI site overview
          </a>
        </p>

        <p className="mt-2 text-[11px] text-gray-600 sm:text-xs">&copy; 2026 UAE Trail. All rights reserved.</p>
      </div>
    </footer>
  );
};
