import { apiRequest } from '../client';

export const mediaApi = {
    presignUpload: (payload: { filename: string; mimeType: string; size: number; keyPrefix?: string; tenantId?: string; kind?: string }) =>
    apiRequest<{ data: { key: string; uploadUrl: string; publicUrl: string; bucket: string } }>('/media/presign-upload', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
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
      body: JSON.stringify(payload)
    }),

    resolveMedia: (key: string) =>
    apiRequest<{ data: { url: string; expiresAt: string; key: string } }>(
      `/media/resolve?key=${encodeURIComponent(key)}`,
      { auth: true }
    )
} as const;
