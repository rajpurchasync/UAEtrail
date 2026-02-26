import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/api-error.js';
import { createPresignedUpload, publicAssetUrl } from '../lib/s3.js';
import { prisma } from '../lib/prisma.js';
import { randomToken } from '../lib/hash.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { env } from '../config/env.js';

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

export const mediaRouter = Router();

mediaRouter.use(requireAuth, requireVerifiedEmail);

mediaRouter.post('/presign-upload', validate({ body: presignSchema }), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof presignSchema>;
    if (body.tenantId) {
      const membership = await prisma.tenantMembership.findUnique({
        where: {
          tenantId_userId: {
            tenantId: body.tenantId,
            userId: req.auth!.userId
          }
        }
      });
      if (!membership && req.auth!.role !== 'PLATFORM_ADMIN') {
        throw new ApiError(403, 'forbidden', 'No tenant permission for media upload.');
      }
    }

    const sanitizedName = body.filename.replace(/[^a-zA-Z0-9._-]/g, '-');
    const key = `${body.keyPrefix}/${Date.now()}-${randomToken(6)}-${sanitizedName}`;
    const uploadUrl = await createPresignedUpload({ key, contentType: body.mimeType });

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
    if (body.tenantId) {
      const membership = await prisma.tenantMembership.findUnique({
        where: {
          tenantId_userId: {
            tenantId: body.tenantId,
            userId: req.auth!.userId
          }
        }
      });
      if (!membership && req.auth!.role !== 'PLATFORM_ADMIN') {
        throw new ApiError(403, 'forbidden', 'No tenant permission for media commit.');
      }
    }

    const saved = await prisma.mediaAsset.create({
      data: {
        key: body.key,
        url: publicAssetUrl(body.key),
        bucket: env.S3_BUCKET,
        mimeType: body.mimeType,
        size: body.size,
        uploadedById: req.auth!.userId,
        tenantId: body.tenantId,
        kind: body.kind
      }
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
