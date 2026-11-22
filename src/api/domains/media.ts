import { apiRequest, postAuthenticatedBlob } from '../client';

export const mediaApi = {
  presignUpload: (payload: { filename: string; mimeType: string; size: number; keyPrefix?: string; tenantId?: string; kind?: string }) =>
    apiRequest<{ data: { key: string; uploadUrl: string; publicUrl: string; bucket: string } }>('/media/presign-upload', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),

  commitUpload: (payload: {
    key: string;
    mimeType: string;
    size: number;
    tenantId?: string;
    kind?: string;
    keyPrefix?: string;
  }) =>
    apiRequest<{ data: { id: string; key: string; url: string } }>('/media/commit', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),

  resolveMedia: (key: string) =>
    apiRequest<{ data: { url: string; expiresAt: string; key: string } }>(
      `/media/resolve?key=${encodeURIComponent(key)}`,
      { auth: true }
    ),

  /** Server-side HEIC→JPEG (etc.) when the browser cannot decode the upload. */
  prepareImage: (file: File, signal?: AbortSignal) =>
    postAuthenticatedBlob('/media/prepare-image', file, {
      contentType: file.type || 'application/octet-stream',
      auth: true,
      signal,
    }),
} as const;