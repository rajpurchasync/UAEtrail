import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { convertImageToDisplayJpeg } from '../src/lib/convert-image-to-jpeg.js';

describe('media prepare-image conversion', () => {
  it('normalizes PNG to JPEG via sharp (all platforms)', async () => {
    const png = await sharp({
      create: { width: 8, height: 8, channels: 3, background: { r: 10, g: 120, b: 200 } },
    })
      .png()
      .toBuffer();

    const jpeg = await convertImageToDisplayJpeg(png);
    expect(jpeg[0]).toBe(0xff);
    expect(jpeg[1]).toBe(0xd8);
    expect(jpeg.length).toBeGreaterThan(50);
  });
});
