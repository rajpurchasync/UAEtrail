import { sniffHeicContainerBytes } from '@uaetrail/shared-types';
import { getStoredSession } from '../api/client';

const HEIC_EXTENSION_PATTERN = /\.(heic|heif)$/i;
const HEIC_MIME_PATTERN = /^image\/hei[cf]/i;
const KNOWN_IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|gif|webp|heic|heif|avif)$/i;

const CONVERT_TIMEOUT_MS = 45_000;
const DECODE_PROBE_TIMEOUT_MS = 5_000;
const ENCODE_TIMEOUT_MS = 30_000;

/** Stored objects use these types so every browser/app can render them. */
const STORAGE_NEUTRAL_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const isHeicImageFile = (file: File): boolean => {
  if (HEIC_MIME_PATTERN.test(file.type)) return true;
  return HEIC_EXTENSION_PATTERN.test(file.name);
};

export const sniffHeicContainer = async (file: File): Promise<boolean> => {
  const header = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  return sniffHeicContainerBytes(header);
};

/** File picker / drag-drop acceptance — includes HEIC and extension-only picks (common on iOS). */
export const isAllowedImageUploadFile = (file: File): boolean => {
  if (file.type.startsWith('image/')) return true;
  if (isHeicImageFile(file)) return true;
  if (!file.type && KNOWN_IMAGE_EXTENSION_PATTERN.test(file.name)) return true;
  return false;
};

const heicBaseName = (filename: string): string => {
  const stripped = filename.replace(HEIC_EXTENSION_PATTERN, '').trim();
  return stripped || 'photo';
};

export const withTimeout = <T>(promise: Promise<T>, ms: number, message: string): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });

/** Try common HEIC MIME labels when the OS leaves `file.type` empty (typical on mobile). */
const browserDecodeCandidates = (file: File): Blob[] => {
  const candidates: Blob[] = [file];
  if (file.type.startsWith('image/')) return candidates;
  if (!isHeicImageFile(file)) return candidates;
  candidates.push(
    new File([file], file.name, { type: 'image/heic', lastModified: file.lastModified }),
    new File([file], file.name, { type: 'image/heif', lastModified: file.lastModified })
  );
  return candidates;
};

const probeCreateImageBitmap = async (blob: Blob): Promise<boolean> => {
  if (typeof createImageBitmap !== 'function') return false;
  try {
    const bitmap = await withTimeout(
      createImageBitmap(blob),
      DECODE_PROBE_TIMEOUT_MS,
      'decode_timeout'
    );
    const ok = bitmap.width > 0 && bitmap.height > 0;
    bitmap.close();
    return ok;
  } catch {
    return false;
  }
};

const readImageSizeFromUrl = (src: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('decode_failed'));
    img.src = src;
  });

const probeHtmlImageElement = async (file: File): Promise<boolean> => {
  const url = URL.createObjectURL(file);
  try {
    const size = await withTimeout(
      readImageSizeFromUrl(url),
      DECODE_PROBE_TIMEOUT_MS,
      'decode_timeout'
    );
    return size.width > 0 && size.height > 0;
  } catch {
    return false;
  } finally {
    URL.revokeObjectURL(url);
  }
};

/**
 * True when the device browser can decode the file locally (incl. HEIC on Safari / many Android builds).
 */
/** HEIC/HEIF (and other non-neutral picks) must be transcoded before upload. */
export const needsStorageNeutralEncode = async (file: File): Promise<boolean> => {
  if (isHeicImageFile(file)) return true;
  if (await sniffHeicContainer(file)) return true;
  const type = file.type.trim().toLowerCase();
  if (type && !STORAGE_NEUTRAL_MIME_TYPES.has(type)) return true;
  if (!type && /\.(heic|heif)$/i.test(file.name)) return true;
  return false;
};

const canvasToJpegFile = async (file: File, draw: (ctx: CanvasRenderingContext2D) => void, width: number, height: number): Promise<File> => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not encode image for upload.');
  }
  draw(ctx);
  const jpeg = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
  });
  if (!jpeg) {
    throw new Error('Could not encode image for upload.');
  }
  const base = heicBaseName(file.name.replace(/\.[^.]+$/, '') || file.name);
  return new File([jpeg], `${base}.jpg`, {
    type: 'image/jpeg',
    lastModified: file.lastModified,
  });
};

/** Transcode a locally decoded HEIC/HEIF pick to JPEG for storage (universal display). */
const encodeToStorageJpegInBrowser = async (file: File): Promise<File> => {
  for (const blob of browserDecodeCandidates(file)) {
    if (typeof createImageBitmap !== 'function') break;
    try {
      const bitmap = await withTimeout(
        createImageBitmap(blob, { imageOrientation: 'from-image' }),
        ENCODE_TIMEOUT_MS,
        'encode_timeout'
      );
      const { width, height } = bitmap;
      const result = await canvasToJpegFile(file, (ctx) => {
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();
      }, width, height);
      return result;
    } catch {
      /* try next candidate */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await withTimeout(
      new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.decoding = 'async';
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('decode_failed'));
        el.src = url;
      }),
      ENCODE_TIMEOUT_MS,
      'encode_timeout'
    );
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    if (width <= 0 || height <= 0) {
      throw new Error('Could not encode image for upload.');
    }
    return await canvasToJpegFile(file, (ctx) => {
      ctx.drawImage(img, 0, 0, width, height);
    }, width, height);
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const canBrowserDecodeAsImage = async (file: File): Promise<boolean> => {
  for (const blob of browserDecodeCandidates(file)) {
    if (await probeCreateImageBitmap(blob)) return true;
  }
  if (await probeHtmlImageElement(file)) return true;
  for (const blob of browserDecodeCandidates(file)) {
    if (blob === file) continue;
    const url = URL.createObjectURL(blob);
    try {
      const size = await withTimeout(
        readImageSizeFromUrl(url),
        DECODE_PROBE_TIMEOUT_MS,
        'decode_timeout'
      );
      if (size.width > 0 && size.height > 0) return true;
    } catch {
      /* try next candidate */
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return false;
};

const prepareImageViaApi = async (file: File): Promise<File> => {
  const session = getStoredSession();
  const headers: Record<string, string> = {
    'Content-Type': file.type || 'application/octet-stream',
  };
  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  const response = await withTimeout(
    fetch('/api/media/prepare-image', {
      method: 'POST',
      headers,
      body: file,
    }),
    CONVERT_TIMEOUT_MS,
    'Image conversion timed out. Try a smaller photo or export as JPG.'
  );

  if (!response.ok) {
    let message = 'Could not prepare this photo. Sign in and try again, or use JPG/PNG.';
    try {
      const payload = (await response.json()) as { error?: { message?: string } };
      if (payload.error?.message) message = payload.error.message;
    } catch {
      /* non-JSON error body */
    }
    if (response.status === 401 || response.status === 403) {
      message = 'Sign in to upload photos, then try again.';
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error('Could not prepare this photo.');
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
  const outputName =
    isHeicImageFile(file) || (await sniffHeicContainer(file))
      ? `${heicBaseName(file.name)}.jpg`
      : `${baseName}.jpg`;

  return new File([blob], outputName, {
    type: 'image/jpeg',
    lastModified: file.lastModified,
  });
};

/**
 * Prepare for upload/crop: decode on-device when possible; stored files are always
 * JPEG/PNG/WebP/GIF — HEIC/HEIF is transcoded locally or via API so all clients can load it.
 */
export const prepareImageUploadFile = async (file: File): Promise<File> => {
  const neutralEncode = await needsStorageNeutralEncode(file);
  const canDecode = await canBrowserDecodeAsImage(file);
  if (canDecode) {
    return neutralEncode ? encodeToStorageJpegInBrowser(file) : file;
  }
  return prepareImageViaApi(file);
};

/** @deprecated Use prepareImageUploadFile */
export const normalizeImageUploadFile = prepareImageUploadFile;
