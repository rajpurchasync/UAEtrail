import { HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
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
    console.warn(`[storage] S3 is not reachable (${message}) — falling back to local file storage.`);
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

export const publicAssetUrl = (key: string): string => {
  if (!s3Available) {
    return `${env.API_BASE_URL}/api/v1/media/local/${key}`;
  }
  return `${env.S3_ENDPOINT!.replace(/\/$/, '')}/${env.S3_BUCKET}/${key}`;
};
