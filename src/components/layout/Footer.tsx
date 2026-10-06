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
          <div className="mb-6 grid gap-6 md:mb-8 md:grid-cols-2 md:gap-0 md:text-left">
            {HOME_FOOTER_FOUNDERS.map((person, index) => (
              <figure
                key={person.role}
                className={[
                  'mx-auto max-w-md text-center md:max-w-none md:px-8',
                  index === 1 ? 'md:border-l md:border-gray-800' : ''
                ].join(' ')}
              >
                <blockquote className="text-xs italic leading-relaxed text-gray-500 sm:text-sm">
                  {person.lines.map((line, lineIndex) => (
                    <p key={lineIndex} className={lineIndex > 0 ? 'mt-2' : undefined}>
                      &ldquo;{line}&rdquo;
                    </p>
                  ))}
                </blockquote>
                <figcaption className="mt-2.5 text-[11px] font-semibold text-gray-400 sm:text-xs">
                  {person.name}
                  <span className="font-normal text-gray-500"> · {person.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
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
