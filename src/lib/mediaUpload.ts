import { api } from '../api/services';
import { getStoredSession } from '../api/client';
import { formatEnvironmentUrl } from '../utils/formatEnvironmentUrl';
import { formatMediaUrl } from '../utils/formatMediaUrl';

interface UploadMediaBlobInput {
  blob: Blob;
  originalName: string;
  keyPrefix?: string;
  tenantId?: string;
  kind?: string;
  filenameSuffix?: string;
}

const safeBaseName = (name: string): string => {
  const base = name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 48);
  return base || 'image';
};

const extensionForMimeType = (mimeType: string): string => {
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/jpeg') return 'jpg';
  return 'bin';
};

export const uploadMediaBlob = async ({
  blob,
  originalName,
  keyPrefix = 'uploads',
  tenantId,
  kind = 'image',
  filenameSuffix,
}: UploadMediaBlobInput): Promise<string> => {
  const mimeType = blob.type || 'application/octet-stream';
  const ext = extensionForMimeType(mimeType);
  const suffix = filenameSuffix ? `-${filenameSuffix}` : '';
  const filename = `${safeBaseName(originalName)}${suffix}.${ext}`;

  const presign = await api.presignUpload({
    filename,
    mimeType,
    size: blob.size,
    keyPrefix,
    tenantId,
    kind,
  });

  const uploadUrl = formatEnvironmentUrl(presign.data.uploadUrl);
  const headers: Record<string, string> = { 'Content-Type': mimeType };
  if (uploadUrl.includes('/media/upload-local/')) {
    const session = getStoredSession();
    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }
  }

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers,
    body: blob,
  });
  if (!uploadRes.ok) {
    throw new Error(`Upload failed (${uploadRes.status}).`);
  }

  const committed = await api.commitUpload({
    key: presign.data.key,
    mimeType,
    size: blob.size,
    tenantId,
    kind,
  });

  return formatMediaUrl(formatEnvironmentUrl(committed.data.url));
};
