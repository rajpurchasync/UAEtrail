export type DetailHeroPhoto = {
  src: string;
  title: string;
  kindLabel: string;
  href: string;
};

const normalizeDetailPath = (path: string): string => {
  const bare = path.split(/[?#]/)[0]?.trim() ?? '';
  return bare.length > 1 && bare.endsWith('/') ? bare.slice(0, -1) : bare;
};

const trailingEntityId = (path: string): string | null => {
  const match = normalizeDetailPath(path).match(/\/([^/]+)$/);
  return match?.[1] ?? null;
};

const isPlaceLikeDetailPath = (path: string): boolean =>
  /^\/(place|camp|trail|venue)\//.test(normalizeDetailPath(path));

/** Hide hero source chip when the slide belongs to the page you are already on. */
export const detailHeroSourceLinkVisible = (
  photoHref: string,
  selfDetailPath: string | undefined
): boolean => {
  if (!selfDetailPath?.trim()) return true;
  const photo = normalizeDetailPath(photoHref);
  const self = normalizeDetailPath(selfDetailPath);
  if (photo === self) return false;
  const photoId = trailingEntityId(photo);
  const selfId = trailingEntityId(self);
  if (photoId && selfId && photoId === selfId && isPlaceLikeDetailPath(photo) && isPlaceLikeDetailPath(self)) {
    return false;
  }
  return true;
};

/** Max photos shown on consumer detail hero carousels (this entity then linked children). */
export const DETAIL_HERO_PHOTO_DISPLAY_MAX = 5;
const MAX_IMAGES_PER_PRIMARY_ENTITY = DETAIL_HERO_PHOTO_DISPLAY_MAX;
const MAX_IMAGES_PER_LINKED_ENTITY = 2;
export const GEO_HERO_PHOTO_COUNT = DETAIL_HERO_PHOTO_DISPLAY_MAX;

const firstHttpUrls = (urls: Array<string | null | undefined>, limit: number): string[] => {
  const out: string[] = [];
  for (const url of urls) {
    const src = url?.trim();
    if (!src) continue;
    out.push(src);
    if (out.length >= limit) break;
  }
  return out;
};

export const collectDetailHeroPhotos = (
  sources: Array<{
    srcs: Array<string | null | undefined>;
    title: string;
    kindLabel: string;
    href: string;
  }>
): DetailHeroPhoto[] => {
  const seen = new Set<string>();
  const photos: DetailHeroPhoto[] = [];
  for (const [index, source] of sources.entries()) {
    const title = source.title.trim();
    const href = source.href.trim();
    if (!title || !href) continue;
    const perEntityLimit =
      index === 0 ? MAX_IMAGES_PER_PRIMARY_ENTITY : MAX_IMAGES_PER_LINKED_ENTITY;
    for (const src of firstHttpUrls(source.srcs, perEntityLimit)) {
      if (seen.has(src)) continue;
      seen.add(src);
      photos.push({
        src,
        title,
        kindLabel: source.kindLabel,
        href,
      });
      if (photos.length >= DETAIL_HERO_PHOTO_DISPLAY_MAX) return photos;
    }
  }
  return photos;
};

/** Shuffle then keep up to `count` photos for a geo/area hero reel. */
export const pickRandomHeroPhotos = (
  photos: DetailHeroPhoto[],
  count = GEO_HERO_PHOTO_COUNT,
  random: () => number = Math.random
): DetailHeroPhoto[] => {
  if (photos.length <= count) return photos;
  const copy = photos.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const a = copy[i]!;
    const b = copy[j]!;
    copy[i] = b;
    copy[j] = a;
  }
  return copy.slice(0, count);
};
