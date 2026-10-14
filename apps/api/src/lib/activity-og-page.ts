import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { activityPublicMetaDescription, buildActivityEventJsonLd } from '@uaetrail/shared-types';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const toAbsoluteUrl = (siteOrigin: string, pathOrUrl: string): string => {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteOrigin.replace(/\/$/, '')}${path}`;
};

const defaultOgImage = (siteOrigin: string) =>
  toAbsoluteUrl(siteOrigin, '/traveler-hiking-mountains-while-having-his-essentials-backpack-optimized.jpg');

const pickOgImage = (siteOrigin: string, activity: ActivityDetailDTO): string => {
  const candidate =
    activity.images?.find((url) => typeof url === 'string' && url.trim().length > 0)?.trim() ??
    activity.bannerUrl?.trim();
  if (!candidate) return defaultOgImage(siteOrigin);
  return toAbsoluteUrl(siteOrigin, candidate);
};

export type ActivityOgPageInput = {
  siteOrigin: string;
  activity: ActivityDetailDTO;
  description: string;
  canonicalPath: string;
  indexable: boolean;
};

export const buildActivityOgDescription = activityPublicMetaDescription;

export const buildActivityOgHtml = (input: ActivityOgPageInput): string => {
  const title = input.activity.title?.trim() || input.activity.locationName?.trim() || 'Outdoor plan on UAE Trail';
  const fullTitle = title.includes('UAE Trail') ? title : `${title} · UAE Trail`;
  const description = input.description.trim();
  const canonicalUrl = toAbsoluteUrl(input.siteOrigin, input.canonicalPath);
  const imageUrl = pickOgImage(input.siteOrigin, input.activity);
  const imageAlt = escapeHtml(title);
  const jsonLd = JSON.stringify(buildActivityEventJsonLd(input.activity, input.siteOrigin)).replace(
    /</g,
    '\\u003c'
  );
  const robots = input.indexable ? 'index, follow' : 'noindex, nofollow';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="${robots}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta property="og:type" content="article" />
  <meta property="og:locale" content="en_AE" />
  <meta property="og:site_name" content="UAE Trail" />
  <meta property="og:title" content="${escapeHtml(fullTitle)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:alt" content="${imageAlt}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(fullTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
  <script type="application/ld+json">${jsonLd}</script>
</head>
<body>
  <main>
    <article>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      <p><img src="${escapeHtml(imageUrl)}" alt="${imageAlt}" width="1200" height="630" loading="eager" /></p>
      <p><a href="${escapeHtml(canonicalUrl)}">View this outing on UAE Trail</a></p>
    </article>
  </main>
</body>
</html>`;
};

export const buildPrivateActivityOgHtml = (siteOrigin: string): string => {
  const title = 'Private outing on UAE Trail';
  const description = 'This plan is only visible to invited members.';
  const canonicalUrl = toAbsoluteUrl(siteOrigin, '/explore');
  const imageUrl = defaultOgImage(siteOrigin);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta name="twitter:card" content="summary_large_image" />
</head>
<body><p>${escapeHtml(description)}</p></body>
</html>`;
};
