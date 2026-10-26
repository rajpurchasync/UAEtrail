import convert from 'heic-convert';
import sharp from 'sharp';
import { sniffHeicContainerBuffer } from '@uaetrail/shared-types';
import { ApiError } from './api-error.js';

/**
 * Server-side image normalize (Linux / Windows / macOS in Docker and bare metal).
 * HEIC/HEIF uses heic-convert (bundled libheif, no OS codec). Other rasters use sharp.
 */
const convertHeicBufferToJpeg = async (input: Buffer): Promise<Buffer> => {
  const converted = await convert({
    buffer: input,
    format: 'JPEG',
    quality: 0.9,
  });
  const jpeg = Buffer.from(converted);
  if (jpeg.length === 0) {
    throw new Error('empty_heic_output');
  }
  return jpeg;
};

const convertRasterBufferToJpeg = async (input: Buffer): Promise<Buffer> => {
  const jpeg = await sharp(input, { failOn: 'none' })
    .rotate()
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
  if (jpeg.length === 0) {
    throw new Error('empty_sharp_output');
  }
  return jpeg;
};

/** Normalize HEIC/HEIF/JPEG/PNG/etc. to JPEG for browser preview and upload. */
export async function convertImageToDisplayJpeg(input: Buffer): Promise<Buffer> {
  const heic = sniffHeicContainerBuffer(input);
  try {
    if (heic) {
      return await convertHeicBufferToJpeg(input);
    }
    return await convertRasterBufferToJpeg(input);
  } catch {
    if (!heic) {
      try {
        return await convertHeicBufferToJpeg(input);
      } catch {
        /* not HEIC */
      }
    }
    throw new ApiError(422, 'image_convert_failed', 'Could not process this image. Try JPG or PNG.');
  }
}
