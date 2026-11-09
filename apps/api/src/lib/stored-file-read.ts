import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { ApiError } from './api-error.js';
import { isS3Available, s3Client } from './s3.js';
import { safePathUnder } from './safe-path.js';
import { env } from '../config/env.js';

const LOCAL_UPLOADS_DIR = join(process.cwd(), 'uploads');

/** Read a private or local object by storage key (S3 or `uploads/` mirror). */
export async function readStoredFile(key: string): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
  const filename = key.split('/').pop() ?? 'download';
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeType =
    ext === 'gpx'
      ? 'application/gpx+xml'
      : ext === 'pdf'
        ? 'application/pdf'
        : 'application/octet-stream';

  if (isS3Available() && s3Client) {
    const response = await s3Client.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
    const body = response.Body;
    if (!body) {
      throw new ApiError(404, 'file_not_found', 'File not found in storage.');
    }
    const bytes = await body.transformToByteArray();
    return { buffer: Buffer.from(bytes), mimeType, filename };
  }

  const filePath = safePathUnder(LOCAL_UPLOADS_DIR, key);
  if (!filePath) {
    throw new ApiError(400, 'invalid_path', 'Invalid file path.');
  }
  try {
    const buffer = await readFile(filePath);
    return { buffer, mimeType, filename };
  } catch {
    throw new ApiError(404, 'file_not_found', 'File not found.');
  }
}
