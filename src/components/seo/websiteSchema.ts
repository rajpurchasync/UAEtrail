import { SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from '../../config/seo';
import { EXPLORE_PLACES_SEARCH_PATH } from '../../config/routingCatalogLite';

/** JSON-LD for the guest home page. Kept off explore routing so `/` stays light. */
export const websiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_ORIGIN,
  description: SITE_DESCRIPTION,
  hasPart: {
    '@type': 'WebPage',
    name: 'Frequently asked questions',
    url: `${SITE_ORIGIN}/faq`,
    description: 'Answers about hiking, camping, and organized outdoor activities in the UAE.',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_ORIGIN}${EXPLORE_PLACES_SEARCH_PATH}&q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});
