import { listPublishedActivitiesForExploreMap } from './activities-store.js';

const xmlEscape = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const buildActivitiesSitemapXml = async (
  siteOrigin: string,
  take = 500
): Promise<string> => {
  const origin = siteOrigin.replace(/\/$/, '');
  const events = await listPublishedActivitiesForExploreMap(take);
  const urls = events.map((event) => {
    const loc = `${origin}/activity/${event.id}`;
    const lastmodSource = event.updatedAt ?? event.startAt;
    const lastmod =
      lastmodSource instanceof Date
        ? lastmodSource.toISOString().slice(0, 10)
        : typeof lastmodSource === 'string'
          ? new Date(lastmodSource).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10);
    return `  <url><loc>${xmlEscape(loc)}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>0.7</priority></url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
};
