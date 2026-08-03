import { CreateBucketCommand, HeadBucketCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import { ApiError } from './api-error.js';

const hasS3Credentials = Boolean(env.S3_ENDPOINT && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY);

/**
 * Whether S3 is both configured **and** reachable.
 * Starts as `false` and is set to `true` only after a successful connectivity
 * check at startup (see `probeS3()`).
 */
let s3Available = false;

export const isS3Available = (): boolean => s3Available;

export const s3Client =
  hasS3Credentials
    ? new S3Client({
        region: env.S3_REGION,
        endpoint: env.S3_ENDPOINT,
        forcePathStyle: env.S3_FORCE_PATH_STYLE,
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY_ID!,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY!
        }
      })
    : null;

/**
 * Probe S3 connectivity at startup. If we can reach the endpoint we mark S3 as
 * available; otherwise we fall back to local file storage silently.
 */
export const probeS3 = async (): Promise<void> => {
  if (!s3Client) {
    console.log('[storage] No S3 credentials — using local file storage.');
    return;
  }
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
    s3Available = true;
    console.log(`[storage] S3 bucket "${env.S3_BUCKET}" is reachable — using S3 storage.`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const notFound =
      (err as { name?: string; $metadata?: { httpStatusCode?: number } }).name === 'NotFound' ||
      (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404;
    if (notFound) {
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }));
        s3Available = true;
        console.log(`[storage] Created S3 bucket "${env.S3_BUCKET}".`);
        return;
      } catch (createErr: unknown) {
        const createMsg = createErr instanceof Error ? createErr.message : String(createErr);
        console.warn(`[storage] Could not create bucket (${createMsg}) — falling back to local storage.`);
      }
    } else {
      console.warn(`[storage] S3 is not reachable (${message}) — falling back to local file storage.`);
    }
    s3Available = false;
  }
};

export const createPresignedUpload = async ({
  key,
  contentType
}: {
  key: string;
  contentType: string;
}): Promise<string> => {
  if (!s3Client || !s3Available) {
    throw new ApiError(503, 'storage_not_configured', 'S3-compatible storage is not available.');
  }

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export type S3ObjectHead = {
  contentLength: number;
  contentType: string | undefined;
};

export const headS3Object = async (key: string): Promise<S3ObjectHead | null> => {
  if (!s3Client || !s3Available) return null;

  try {
    const result = await s3Client.send(
      new HeadObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key
      })
    );
    return {
      contentLength: result.ContentLength ?? 0,
      contentType: result.ContentType
    };
  } catch {
    return null;
  }
};

export const publicAssetUrl = (key: string): string => {
  if (!s3Available) {
    return `/api/v1/media/local/${key}`;
  }
  const base = (env.S3_PUBLIC_URL ?? env.S3_ENDPOINT)!.replace(/\/$/, '');
  return `${base}/${env.S3_BUCKET}/${key}`;
};
