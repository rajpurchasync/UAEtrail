const PRIVATE_MEDIA_KINDS = ['avatar', 'waiver', 'private_photo'] as const;
const PROFILE_VISIBILITIES = ['public', 'group_members', 'private'] as const;

export type PrivateMediaKind = (typeof PRIVATE_MEDIA_KINDS)[number];
export type ProfileVisibility = (typeof PROFILE_VISIBILITIES)[number];

const KIND_FROM_SEGMENT: Record<string, string> = {
  avatars: 'avatar',
  waivers: 'waiver',
  'private-photos': 'private_photo',
  uploads: 'general',
  activities: 'activity',
  locations: 'location',
  shop: 'shop',
  guides: 'guide'
};

const KNOWN_BUCKETS = ['uaetrail-private', 'uaetrail-public', 'uaetrail-assets'];

export const isPrivateMediaKind = (kind: string): kind is PrivateMediaKind =>
  (PRIVATE_MEDIA_KINDS as readonly string[]).includes(kind);

export const normalizeProfileVisibility = (value: unknown): ProfileVisibility => {
  if (value === 'group_members' || value === 'private' || value === 'public') {
    return value;
  }
  return 'public';
};

export const bucketForKind = (
  kind: string,
  buckets: { publicBucket: string; privateBucket: string }
): string => (isPrivateMediaKind(kind) ? buckets.privateBucket : buckets.publicBucket);

export type MediaAccessInput = {
  kind: string;
  visibility: ProfileVisibility;
  viewerUserId: string | null;
  ownerUserId: string | null;
  sharesGroupOrActivity: boolean;
  isPlatformAdmin: boolean;
};

/** Decide whether a viewer may receive a time-limited GET URL for a media object. */
export const canAccessMedia = (input: MediaAccessInput): boolean => {
  if (input.isPlatformAdmin) return true;
  if (input.viewerUserId && input.ownerUserId && input.viewerUserId === input.ownerUserId) {
    return true;
  }

  if (!isPrivateMediaKind(input.kind)) {
    return true;
  }

  switch (input.visibility) {
    case 'public':
      return true;
    case 'private':
      return false;
    case 'group_members':
      return Boolean(input.viewerUserId) && input.sharesGroupOrActivity;
    default:
      return false;
  }
};

export const parseMediaKey = (
  key: string
): { userId: string | null; tenantId: string | null; kind: string } | null => {
  const clean = key.replace(/^\//, '').split('?')[0];
  const parts = clean.split('/').filter(Boolean);
  if (parts.length < 3) return null;

  if (parts[0] === 'users') {
    return {
      userId: parts[1] ?? null,
      tenantId: null,
      kind: KIND_FROM_SEGMENT[parts[2]] ?? 'general'
    };
  }
  if (parts[0] === 'tenants') {
    return {
      userId: null,
      tenantId: parts[1] ?? null,
      kind: KIND_FROM_SEGMENT[parts[2]] ?? 'general'
    };
  }
  return null;
};

export const extractStorageKey = (raw: string, extraBuckets: string[] = []): string | null => {
  const value = raw.trim();
  if (!value) return null;
  if (/^(users|tenants)\//.test(value)) {
    return value.split('?')[0];
  }

  const buckets = new Set([...KNOWN_BUCKETS, ...extraBuckets.filter(Boolean)]);

  try {
    const url = value.startsWith('http://') || value.startsWith('https://')
      ? new URL(value)
      : new URL(value, 'http://placeholder.local');
    const fromQuery = url.searchParams.get('key');
    if (fromQuery) return fromQuery;

    const parts = url.pathname.split('/').filter(Boolean);
    const mediaIdx = parts.findIndex((part, index) => part === 'media' && parts[index + 1] === 'local');
    if (mediaIdx >= 0) {
      const rest = parts.slice(mediaIdx + 2).join('/');
      return rest || null;
    }

    const bucketIdx = parts.findIndex((part) => buckets.has(part));
    if (bucketIdx >= 0) {
      const rest = parts.slice(bucketIdx + 1).join('/');
      return rest || null;
    }
  } catch {
    return null;
  }

  return null;
};
