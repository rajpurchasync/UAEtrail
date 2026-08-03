import { Router, raw } from 'express';
import { z } from 'zod';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { ApiError } from '../lib/api-error.js';
import { createPresignedUpload, isS3Available, publicAssetUrl } from '../lib/s3.js';
import { safePathUnder } from '../lib/safe-path.js';
import { randomToken } from '../lib/hash.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { env } from '../config/env.js';
import { assertPresignedUploadOwner, registerPresignedUpload } from '../lib/media-presign.js';
import { createMediaAssetRecord } from '../lib/media-store.js';
import { hasTenantMembership } from '../lib/tenant-access.js';

/** Resolve absolute path for local uploads (relative to apps/api/) */
const LOCAL_UPLOADS_DIR = join(process.cwd(), 'uploads');

const presignSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
  keyPrefix: z.string().default('uploads'),
  tenantId: z.string().optional(),
  kind: z.string().default('general')
});

const commitSchema = z.object({
  key: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
  tenantId: z.string().optional(),
  kind: z.string().default('general')
});

/** Keys issued by presign-upload follow: {prefix}/{timestamp}-{token}-{filename} */
const PRESIGN_KEY_PATTERN = /^[\w-]+\/\d+-[a-f0-9]+-.+$/i;

const assertValidPresignKey = (key: string): void => {
  if (!PRESIGN_KEY_PATTERN.test(key)) {
    throw new ApiError(400, 'invalid_key', 'Media key does not match an issued upload.');
  }
};

/** Local file fallback is dev-only when S3 is not configured. */
const isLocalMediaDevMode = (): boolean =>
  env.NODE_ENV !== 'production' && !isS3Available();

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

mediaRouter.use(requireAuth, requireVerifiedEmail);

mediaRouter.post('/presign-upload', validate({ body: presignSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof presignSchema>;
    if (body.tenantId) {
      const membership = await hasTenantMembership(body.tenantId, req.auth!.userId);
      if (!membership && req.auth!.role !== 'PLATFORM_ADMIN') {
        throw new ApiError(403, 'forbidden', 'No tenant permission for media upload.');
      }
    }

    const sanitizedName = body.filename.replace(/[^a-zA-Z0-9._-]/g, '-');
    const key = `${body.keyPrefix}/${Date.now()}-${randomToken(6)}-${sanitizedName}`;

    await registerPresignedUpload(key, req.auth!.userId);

    let uploadUrl: string;
    if (isS3Available()) {
      uploadUrl = await createPresignedUpload({ key, contentType: body.mimeType });
    } else {
      // Relative path — works through Vite dev proxy and same-origin production
      uploadUrl = `/api/v1/media/upload-local/${key}`;
    }

    res.json({
      data: {
        key,
        uploadUrl,
        publicUrl: publicAssetUrl(key),
        bucket: env.S3_BUCKET
      }
    });
  } catch (error) {
    next(error);
  }
});

mediaRouter.post('/commit', validate({ body: commitSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof commitSchema>;
    assertValidPresignKey(body.key);
    try {
      await assertPresignedUploadOwner(body.key, req.auth!.userId);
    } catch {
      throw new ApiError(403, 'invalid_upload', 'Upload key is invalid or was issued to another user.');
    }
    if (body.tenantId) {
      const membership = await hasTenantMembership(body.tenantId, req.auth!.userId);
      if (!membership && req.auth!.role !== 'PLATFORM_ADMIN') {
        throw new ApiError(403, 'forbidden', 'No tenant permission for media commit.');
      }
    }

    const saved = await createMediaAssetRecord({
      key: body.key,
      url: publicAssetUrl(body.key),
      bucket: env.S3_BUCKET,
      mimeType: body.mimeType,
      size: body.size,
      uploadedById: req.auth!.userId,
      tenantId: body.tenantId,
      kind: body.kind
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
