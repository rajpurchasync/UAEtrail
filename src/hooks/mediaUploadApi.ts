import { api } from '../api/index';

export const presignMediaUpload = async (payload: {
  filename: string;
  mimeType: string;
  size: number;
  keyPrefix?: string;
  tenantId?: string;
  kind?: string;
}): Promise<{ key: string; uploadUrl: string }> => {
  const res = await api.presignUpload(payload);
  return res.data;
};

export const commitMediaUpload = async (payload: {
  key: string;
  mimeType: string;
  size: number;
  kind?: string;
}): Promise<void> => {
  await api.commitUpload(payload);
};
