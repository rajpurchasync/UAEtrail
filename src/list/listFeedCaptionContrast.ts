/** Bottom caption contrast — works for arbitrary member/venue uploads. */

export type ListFeedCaptionScrim = 'light' | 'medium' | 'strong' | 'default';

const relativeLuminance = (r: number, g: number, b: number): number =>
  (0.299 * r + 0.587 * g + 0.114 * b) / 255;

/**
 * Average luminance (0–1) of the lower ~38% of a loaded photo.
 * Returns null when canvas is tainted (cross-origin without CORS) or dimensions missing.
 */
export const sampleImageBottomLuminance = (img: HTMLImageElement): number | null => {
  try {
    if (!img.naturalWidth || !img.naturalHeight) return null;

    const canvas = document.createElement('canvas');
    const sourceBandHeight = Math.max(12, Math.floor(img.naturalHeight * 0.38));
    const width = Math.min(96, img.naturalWidth);
    const height = Math.min(72, sourceBandHeight);
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(
      img,
      0,
      img.naturalHeight - sourceBandHeight,
      img.naturalWidth,
      sourceBandHeight,
      0,
      0,
      width,
      height
    );

    const { data } = ctx.getImageData(0, 0, width, height);
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 20) continue;
      sum += relativeLuminance(data[i], data[i + 1], data[i + 2]);
      count += 1;
    }
    return count ? sum / count : null;
  } catch {
    return null;
  }
};

/** Pick scrim strength from bottom-band brightness — bright/busy photos need more contrast. */
export const resolveListFeedCaptionScrim = (bottomLuminance: number | null): ListFeedCaptionScrim => {
  if (bottomLuminance == null) return 'default';
  if (bottomLuminance >= 0.62) return 'strong';
  if (bottomLuminance >= 0.4) return 'medium';
  return 'light';
};

/** Tailwind `before:` gradient stops — paired with `LIST_FEED.overlayPhotoScrimBase`. */
export const LIST_FEED_CAPTION_SCRIM_CLASS: Record<ListFeedCaptionScrim, string> = {
  default:
    'before:from-black/80 before:from-0% before:via-black/50 before:via-[45%] before:to-transparent before:to-100%',
  strong:
    'before:from-black/92 before:from-0% before:via-black/65 before:via-[52%] before:to-transparent before:to-100%',
  medium:
    'before:from-black/78 before:from-0% before:via-black/48 before:via-[42%] before:to-transparent before:to-100%',
  light:
    'before:from-black/62 before:from-0% before:via-black/32 before:via-[34%] before:to-transparent before:to-100%',
};
