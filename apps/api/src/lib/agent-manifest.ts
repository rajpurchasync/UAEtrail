import type { AgentManifestDTO } from '@uaetrail/shared-types';

export const buildAgentManifest = (siteOrigin: string): AgentManifestDTO => {
  const origin = siteOrigin.replace(/\/$/, '');
  const apiBase = `${origin}/api`;

  return {
    schema_version: '1.0',
    name: 'UAE Trail',
    description:
      'Find like-minded company for outdoor plans in the UAE and GCC — discover outings, trails, camps, and venues, then join or request to go together.',
    website: origin,
    product_home: `${origin}/explore`,
    documentation: {
      llms_txt: `${origin}/llms.txt`,
      llms_full_txt: `${origin}/llms-full.txt`,
      openapi_json: `${origin}/api/openapi.json`,
    },
    discovery: {
      search_url: `${apiBase}/agent/discover`,
      method: 'GET',
      parameters: {
        q: {
          required: true,
          description: 'Free-text search across public outing titles, places, and regions.',
          max_length: 64,
        },
        kind: {
          required: false,
          default: 'all',
          values: ['all', 'activity', 'place'],
        },
        region: {
          required: false,
          description: 'Optional emirate or region filter (case-insensitive substring).',
        },
        limit: {
          required: false,
          default: 10,
          max: 25,
        },
      },
      response_schema_version: '1.0',
    },
    sitemaps: [`${origin}/sitemap.xml`, `${origin}/sitemap-activities.xml`],
    allowed_scrape_paths: [
      '/explore',
      '/activity/',
      '/place/',
      '/facility/',
      '/venue/',
      '/shop/',
      '/faq',
      '/llms.txt',
      '/llms-full.txt',
      '/api/agent/',
      '/api/activities',
      '/api/places',
      '/api/facilities',
      '/api/explore/map',
    ],
    disallowed_paths: [
      '/admin/',
      '/host/',
      '/messages',
      '/profile',
      '/signin',
      '/signup',
      '/api/me/',
      '/api/chat/',
    ],
  };
};
