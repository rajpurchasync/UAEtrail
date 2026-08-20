import { Router, raw } from 'express';
import { z } from 'zod';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { ApiError } from '../lib/api-error.js';
import {
  createPresignedGet,
  createPresignedUpload,
  headS3Object,
  isS3Available,
  PRESIGN_GET_TTL_SECONDS,
  publicAssetUrl,
  storageBucketForKind
} from '../lib/s3.js';
import { safePathUnder } from '../lib/safe-path.js';
import { randomToken } from '../lib/hash.js';
import { optionalAuth } from '../middleware/optional-auth.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { env } from '../config/env.js';
import { assertPresignedUploadOwner, registerPresignedUpload } from '../lib/media-presign.js';
import { createMediaAssetRecord, findMediaAssetByKey } from '../lib/media-store.js';
import { hasTenantMembership } from '../lib/tenant-access.js';
import { findAuthUserById } from '../lib/auth-users.js';
import { usersShareActiveGroup } from '../lib/social-groups-store.js';
import { usersShareEvent } from '../lib/event-engagement-store.js';
import {
  canAccessMedia,
  extractStorageKey,
  isPrivateMediaKind,
  normalizeProfileVisibility,
  parseMediaKey
} from '../lib/media-access.js';

/** Resolve absolute path for local uploads (relative to apps/api/) */
const LOCAL_UPLOADS_DIR = join(process.cwd(), 'uploads');

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

type MediaKind = 'general' | 'avatar' | 'event' | 'location' | 'shop' | 'guide' | 'waiver' | 'private_photo';

const KIND_PREFIX: Record<MediaKind, string> = {
  general: 'uploads',
  avatar: 'avatars',
  event: 'events',
  location: 'locations',
  shop: 'shop',
  guide: 'guides',
  waiver: 'waivers',
  private_photo: 'private-photos'
};

const isAllowedMimeType = (mimeType: string): boolean =>
  mimeType.startsWith('image/') ||
  mimeType === 'application/pdf' ||
  mimeType === 'application/gpx+xml' ||
  mimeType === 'application/octet-stream';

const resolveMediaKeyPrefix = (input: {
  kind: MediaKind;
  tenantId?: string;
  userId: string;
}): string => {
  const segment = KIND_PREFIX[input.kind];
  if (input.tenantId) return `tenants/${input.tenantId}/${segment}`;
  return `users/${input.userId}/${segment}`;
};

const resolveMediaKind = (input: {
  kind?: string;
  keyPrefix?: string;
}): MediaKind => {
  const fromPrefix: Record<string, MediaKind> = {
    uploads: 'general',
    avatars: 'avatar',
    events: 'event',
    locations: 'location',
    products: 'shop',
    shop: 'shop',
    guides: 'guide',
    'host-profiles': 'guide',
    community: 'general',
    waivers: 'waiver',
    'private-photos': 'private_photo'
  };
  if (input.keyPrefix && fromPrefix[input.keyPrefix]) {
    return fromPrefix[input.keyPrefix];
  }
  if (input.kind && input.kind in KIND_PREFIX) {
    return input.kind as MediaKind;
  }
  return 'general';
};

const presignSchema = z.object({
  filename: z.string().min(1).max(200),
  mimeType: z.string().min(1),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  tenantId: z.string().optional(),
  kind: z.string().optional(),
  keyPrefix: z.string().optional()
});

const commitSchema = z.object({
  key: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  tenantId: z.string().optional(),
  kind: z.string().optional(),
  keyPrefix: z.string().optional()
});

const resolveQuerySchema = z.object({
  key: z.string().min(1).max(2000)
});

/** Keys issued by presign-upload follow: {scope}/{segment}/{timestamp}-{token}-{filename} */
const PRESIGN_KEY_PATTERN =
  /^(users\/[\w-]+|tenants\/[\w-]+)\/(uploads|avatars|events|locations|shop|guides|waivers|private-photos)\/\d+-[a-f0-9]+-.+$/i;

const assertValidPresignKey = (key: string): void => {
  if (!PRESIGN_KEY_PATTERN.test(key)) {
    throw new ApiError(400, 'invalid_key', 'Media key does not match an issued upload.');
  }
};

const assertAllowedMimeType = (mimeType: string): void => {
  if (!isAllowedMimeType(mimeType)) {
    throw new ApiError(400, 'invalid_mime_type', 'File type is not allowed.');
  }
};

const assertTenantMediaAccess = async (
  tenantId: string | undefined,
  userId: string,
  role: string
): Promise<void> => {
  if (!tenantId) return;
  const membership = await hasTenantMembership(tenantId, userId);
  if (!membership && role !== 'PLATFORM_ADMIN') {
    throw new ApiError(403, 'forbidden', 'No tenant permission for media upload.');
  }
};

/** Local file fallback is dev-only when S3 is not configured. */
const isLocalMediaDevMode = (): boolean =>
  env.NODE_ENV !== 'production' && !isS3Available();

const extraKnownBuckets = (): string[] => [env.S3_PUBLIC_BUCKET, env.S3_PRIVATE_BUCKET, env.S3_BUCKET];

export const mediaRouter = Router();

if (isLocalMediaDevMode()) {
  /* ─── Serve local uploads when S3 is not configured (dev only) ─────────── */
  mediaRouter.get('/local/*', (req, res) => {
  const filePath = (req.params as unknown as Record<string, string>)[0] ?? req.path.replace('/local/', '');
  const absolute = safePathUnder(LOCAL_UPLOADS_DIR, filePath);
  if (!absolute) {
    res.status(400).json({ error: { code: 'invalid_path', message: 'Invalid file path.' } });
    return;
  }
  res.sendFile(absolute, (err) => {
    if (err) {
      res.status(404).json({ error: { code: 'not_found', message: 'File not found.' } });
    }
  });
});

/* ─── Local PUT upload endpoint (dev fallback when no S3) ───────────────── */
mediaRouter.put(
  '/upload-local/*',
  requireAuth,
  raw({ type: '*/*', limit: '20mb' }),
  async (req, res) => {
    const key = (req.params as unknown as Record<string, string>)[0] ?? req.path.replace('/upload-local/', '');
    const filePath = safePathUnder(LOCAL_UPLOADS_DIR, key);
    if (!filePath) {
      res.status(400).json({ error: { code: 'invalid_path', message: 'Invalid upload path.' } });
      return;
    }

    try {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, req.body as Buffer);
      res.status(200).json({ ok: true });
    } catch {
      res.status(500).json({ error: { code: 'upload_failed', message: 'Local file write failed.' } });
    }
  });
}

mediaRouter.get('/resolve', optionalAuth, validate({ query: resolveQuerySchema }), async (req, res, next) => {
  try {
    const rawKey = (req.query as z.infer<typeof resolveQuerySchema>).key;
    const key = extractStorageKey(rawKey, extraKnownBuckets());
    if (!key) {
      throw new ApiError(400, 'invalid_key', 'Media key is invalid.');
    }

    const asset = await findMediaAssetByKey(key);
    const parsed = parseMediaKey(key);
    const kind = asset?.kind ?? parsed?.kind ?? 'general';
    const ownerUserId = asset?.uploadedById ?? parsed?.userId ?? null;

    if (isPrivateMediaKind(kind) && !ownerUserId) {
      throw new ApiError(403, 'forbidden', 'You cannot access this media.');
    }

    const owner = ownerUserId ? await findAuthUserById(ownerUserId) : null;
    const visibility = normalizeProfileVisibility(owner?.profile?.profileVisibility);
    const viewerUserId = req.auth?.userId ?? null;
    const isPlatformAdmin = req.auth?.role === 'PLATFORM_ADMIN';

    let sharesGroupOrEvent = false;
    if (
      viewerUserId &&
      ownerUserId &&
      viewerUserId !== ownerUserId &&
      visibility === 'group_members'
    ) {
      sharesGroupOrEvent =
        (await usersShareActiveGroup(viewerUserId, ownerUserId)) ||
        (await usersShareEvent(viewerUserId, ownerUserId));
    }

    const allowed = canAccessMedia({
      kind,
      visibility,
      viewerUserId,
      ownerUserId,
      sharesGroupOrEvent,
      isPlatformAdmin
    });
    if (!allowed) {
      throw new ApiError(403, 'forbidden', 'You cannot access this media.');
    }

    const bucket = asset?.bucket || storageBucketForKind(kind);
    const expiresAt = new Date(Date.now() + PRESIGN_GET_TTL_SECONDS * 1000);

    if (isS3Available()) {
      const url = await createPresignedGet({ key, bucket });
      res.json({
        data: {
          url,
          expiresAt: expiresAt.toISOString(),
          key
        }
      });
      return;
    }

    if (!isLocalMediaDevMode()) {
      throw new ApiError(503, 'storage_not_configured', 'S3-compatible storage is not available.');
    }

    res.json({
      data: {
        url: `/api/v1/media/local/${key}`,
        expiresAt: expiresAt.toISOString(),
        key
      }
    });
  } catch (error) {
    next(error);
  }
});

mediaRouter.use(requireAuth, requireVerifiedEmail);

mediaRouter.post('/presign-upload', validate({ body: presignSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof presignSchema>;
    const kind = resolveMediaKind(body);
    assertAllowedMimeType(body.mimeType);
    await assertTenantMediaAccess(body.tenantId, req.auth!.userId, req.auth!.role);

    const keyPrefix = resolveMediaKeyPrefix({
      kind,
      tenantId: body.tenantId,
      userId: req.auth!.userId
    });
    const sanitizedName = body.filename.replace(/[^a-zA-Z0-9._-]/g, '-');
    const key = `${keyPrefix}/${Date.now()}-${randomToken(6)}-${sanitizedName}`;
    const bucket = storageBucketForKind(kind);

    await registerPresignedUpload(key, req.auth!.userId);

    let uploadUrl: string;
    if (isS3Available()) {
      uploadUrl = await createPresignedUpload({ key, contentType: body.mimeType, bucket });
    } else {
      // Relative path — works through Vite dev proxy and same-origin production
      uploadUrl = `/api/v1/media/upload-local/${key}`;
    }

    res.json({
      data: {
        key,
        uploadUrl,
        publicUrl: publicAssetUrl(key, kind, bucket),
        bucket
      }
    });
  } catch (error) {
    next(error);
  }
});

mediaRouter.post('/commit', validate({ body: commitSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof commitSchema>;
    const kind = resolveMediaKind(body);
    assertValidPresignKey(body.key);
    assertAllowedMimeType(body.mimeType);
    try {
      await assertPresignedUploadOwner(body.key, req.auth!.userId);
    } catch {
      throw new ApiError(403, 'invalid_upload', 'Upload key is invalid or was issued to another user.');
    }
    await assertTenantMediaAccess(body.tenantId, req.auth!.userId, req.auth!.role);

    let mimeType = body.mimeType;
    let size = body.size;
    const bucket = storageBucketForKind(kind);

    if (isS3Available()) {
      const object = await headS3Object(body.key, bucket);
      if (!object || object.contentLength <= 0) {
        throw new ApiError(400, 'upload_missing', 'Uploaded file was not found in storage.');
      }
      if (object.contentLength > MAX_UPLOAD_BYTES) {
        throw new ApiError(400, 'file_too_large', 'Uploaded file exceeds the size limit.');
      }
      mimeType = object.contentType ?? body.mimeType;
      size = object.contentLength;
      assertAllowedMimeType(mimeType);
    } else if (isLocalMediaDevMode()) {
      const filePath = safePathUnder(LOCAL_UPLOADS_DIR, body.key);
      if (!filePath) {
        throw new ApiError(400, 'invalid_path', 'Invalid upload path.');
      }
      try {
        const fileStat = await stat(filePath);
        size = fileStat.size;
      } catch {
        throw new ApiError(400, 'upload_missing', 'Uploaded file was not found in storage.');
      }
    }

    const saved = await createMediaAssetRecord({
      key: body.key,
      url: publicAssetUrl(body.key, kind, bucket),
      bucket,
      mimeType,
      size,
      uploadedById: req.auth!.userId,
      tenantId: body.tenantId,
      kind
    });

    res.status(201).json({
      data: {
        id: saved.id,
        key: saved.key,
        url: saved.url,
        kind: saved.kind
      }
    });
  } catch (error) {
    next(error);
  }
});
