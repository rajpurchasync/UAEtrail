import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import { ApiError } from './api-error.js';
import { formatEnvironmentUrl } from './format-environment-url.js';
import { bucketForKind, isPrivateMediaKind } from './media-access.js';

const hasS3Credentials = Boolean(env.S3_ENDPOINT && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY);

const PRESIGN_EXPIRES_SECONDS = 3600;

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

export const storageBucketForKind = (kind: string): string =>
  bucketForKind(kind, {
    publicBucket: env.S3_PUBLIC_BUCKET,
    privateBucket: env.S3_PRIVATE_BUCKET
  });

const rewriteStorageUrl = (url: string): string => formatEnvironmentUrl(url, env.S3_PUBLIC_URL);

const ensureBucket = async (bucket: string): Promise<boolean> => {
  if (!s3Client) return false;
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
    return true;
  } catch (err: unknown) {
    const notFound =
      (err as { name?: string; $metadata?: { httpStatusCode?: number } }).name === 'NotFound' ||
      (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404;
    if (!notFound) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[storage] S3 bucket "${bucket}" is not reachable (${message}).`);
      return false;
    }
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
      console.log(`[storage] Created S3 bucket "${bucket}".`);
      return true;
    } catch (createErr: unknown) {
      const createMsg = createErr instanceof Error ? createErr.message : String(createErr);
      console.warn(`[storage] Could not create bucket "${bucket}" (${createMsg}).`);
      return false;
    }
  }
};

/**
 * Probe S3 connectivity at startup. If we can reach the endpoint we mark S3 as
 * available; otherwise we fall back to local file storage silently.
 */
export const probeS3 = async (): Promise<void> => {
  if (!s3Client) {
    console.log('[storage] No S3 credentials — using local file storage.');
    return;
  }

  const buckets = [...new Set([env.S3_PUBLIC_BUCKET, env.S3_PRIVATE_BUCKET, env.S3_BUCKET])];
  const results = await Promise.all(buckets.map((bucket) => ensureBucket(bucket)));
  s3Available = results.some(Boolean);

  if (s3Available) {
    console.log(`[storage] S3 buckets reachable: ${buckets.filter((_, index) => results[index]).join(', ')}.`);
  } else {
    console.warn('[storage] S3 is not reachable — falling back to local file storage.');
  }
};

export const createPresignedUpload = async ({
  key,
  contentType,
  bucket
}: {
  key: string;
  contentType: string;
  bucket: string;
}): Promise<string> => {
  if (!s3Client || !s3Available) {
    throw new ApiError(503, 'storage_not_configured', 'S3-compatible storage is not available.');
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType
  });

  const signed = await getSignedUrl(s3Client, command, { expiresIn: PRESIGN_EXPIRES_SECONDS });
  return rewriteStorageUrl(signed);
};

export const createPresignedGet = async ({
  key,
  bucket
}: {
  key: string;
  bucket: string;
}): Promise<string> => {
  if (!s3Client || !s3Available) {
    throw new ApiError(503, 'storage_not_configured', 'S3-compatible storage is not available.');
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key
  });

  const signed = await getSignedUrl(s3Client, command, { expiresIn: PRESIGN_EXPIRES_SECONDS });
  return rewriteStorageUrl(signed);
};

export const PRESIGN_GET_TTL_SECONDS = PRESIGN_EXPIRES_SECONDS;

export type S3ObjectHead = {
  contentLength: number;
  contentType: string | undefined;
};

export const headS3Object = async (key: string, bucket: string): Promise<S3ObjectHead | null> => {
  if (!s3Client || !s3Available) return null;

  try {
    const result = await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucket,
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

export const publicAssetUrl = (key: string, kind: string, bucket = storageBucketForKind(kind)): string => {
  if (isPrivateMediaKind(kind)) {
    return `/api/v1/media/resolve?key=${encodeURIComponent(key)}`;
  }
  if (!s3Available) {
    return `/api/v1/media/local/${key}`;
  }
  const base = (env.S3_PUBLIC_URL ?? env.S3_ENDPOINT)!.replace(/\/$/, '');
  return rewriteStorageUrl(`${base}/${bucket}/${key}`);
};
