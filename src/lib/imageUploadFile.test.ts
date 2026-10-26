import { sniffHeicContainerBytes } from '@uaetrail/shared-types';
import { describe, expect, it } from 'vitest';
import { isAllowedImageUploadFile, isHeicImageFile, needsStorageNeutralEncode } from './imageUploadFile';

describe('imageUploadFile', () => {
  const file = (name: string, type: string) => new File(['x'], name, { type });

  it('detects HEIC by mime and extension', () => {
    expect(isHeicImageFile(file('photo.heic', 'image/heic'))).toBe(true);
    expect(isHeicImageFile(file('photo.HEIF', ''))).toBe(true);
    expect(isHeicImageFile(file('photo.jpg', 'image/jpeg'))).toBe(false);
  });

  it('sniffs HEIC container from ftyp brand (shared-types)', () => {
    const heicHeader = new Uint8Array([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63,
    ]);
    expect(sniffHeicContainerBytes(heicHeader)).toBe(true);
    const mif1Header = new Uint8Array([
      0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x69, 0x66, 0x31,
    ]);
    expect(sniffHeicContainerBytes(mif1Header)).toBe(true);
    const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    expect(sniffHeicContainerBytes(jpegHeader)).toBe(false);
  });

  it('flags HEIC for storage-neutral JPEG transcode', async () => {
    expect(await needsStorageNeutralEncode(file('photo.heic', 'image/heic'))).toBe(true);
    expect(await needsStorageNeutralEncode(file('photo.jpg', 'image/jpeg'))).toBe(false);
    expect(await needsStorageNeutralEncode(file('photo.webp', 'image/webp'))).toBe(false);
  });

  it('allows HEIC and extension-only image picks', () => {
    expect(isAllowedImageUploadFile(file('IMG_0001.HEIC', ''))).toBe(true);
    expect(isAllowedImageUploadFile(file('shot.heif', 'image/heif'))).toBe(true);
    expect(isAllowedImageUploadFile(file('shot.jpg', 'image/jpeg'))).toBe(true);
    expect(isAllowedImageUploadFile(file('notes.pdf', 'application/pdf'))).toBe(false);
  });
});
