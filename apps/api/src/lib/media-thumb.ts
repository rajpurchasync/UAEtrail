import sharp from 'sharp';

/** Map/catalog thumbnail edge — stored as sibling key `{base}-thumb.jpg`. */
export const MEDIA_CATALOG_THUMB_EDGE_PX = 480;

export const deriveMediaThumbStorageKey = (key: string): string => {
  const normalized = key.split('?')[0];
  const dot = normalized.lastIndexOf('.');
  if (dot <= 0) return `${normalized}-thumb.jpg`;
  return `${normalized.slice(0, dot)}-thumb.jpg`;
};

export const isImageMimeType = (mimeType: string | undefined): boolean =>
  !!mimeType && mimeType.startsWith('image/');

export async function convertBufferToCatalogThumbJpeg(input: Buffer): Promise<Buffer> {
  const jpeg = await sharp(input, { failOn: 'none' })
    .rotate()
    .resize({
      width: MEDIA_CATALOG_THUMB_EDGE_PX,
      height: MEDIA_CATALOG_THUMB_EDGE_PX,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  if (jpeg.length === 0) {
    throw new Error('empty_thumb_output');
  }
  return jpeg;
}
