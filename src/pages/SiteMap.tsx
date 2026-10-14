import { Link } from 'react-router-dom';
import { PageMeta } from '../components/seo/PageMeta';
import { SITE_ORIGIN } from '../config/seo';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { PUBLIC_SITE_MAP } from '../content/siteMap';

export const SiteMap = () => (
  <>
    <PageMeta
      title="Site map"
      description="Browse all public pages on UAE Trail — explore, activities, help, and legal."
      path="/sitemap"
    />

    <ConsumerShell layout="stack" title="Site map" showJourney={false} back={{ fallbackTo: '/', label: 'Home' }}>
      <p className="text-sm leading-relaxed text-neutral-600 md:text-base">
        Quick links to every public page. Crawlers can also use{' '}
        <a href={`${SITE_ORIGIN}/sitemap.xml`} className="font-medium text-emerald-700 hover:underline">
          sitemap.xml
        </a>
        .
      </p>

      <ul className="mt-6 divide-y divide-neutral-200/80 rounded-2xl border border-neutral-200/80 bg-white pb-nav-safe">
        {PUBLIC_SITE_MAP.map((entry) => (
          <li key={entry.path}>
            <Link
              to={entry.path}
              className="block px-4 py-4 transition-colors hover:bg-neutral-50 md:px-5"
            >
              <span className="text-sm font-semibold text-neutral-900">{entry.label}</span>
              <span className="mt-0.5 block text-sm text-neutral-600">{entry.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </ConsumerShell>
  </>
);
