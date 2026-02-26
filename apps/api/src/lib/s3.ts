import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import { ApiError } from './api-error.js';

const hasS3Credentials = Boolean(env.S3_ENDPOINT && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY);

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

export const createPresignedUpload = async ({
  key,
  contentType
}: {
  key: string;
  contentType: string;
}): Promise<string> => {
  if (!s3Client) {
    throw new ApiError(503, 'storage_not_configured', 'S3-compatible storage is not configured.');
  }

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export const publicAssetUrl = (key: string): string => {
  if (!env.S3_ENDPOINT) {
    return `${env.API_BASE_URL}/assets/${key}`;
  }
  return `${env.S3_ENDPOINT.replace(/\/$/, '')}/${env.S3_BUCKET}/${key}`;
};
