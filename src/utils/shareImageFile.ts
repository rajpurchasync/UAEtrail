export type ShareImageResult = 'shared' | 'downloaded' | 'unsupported';

/** Native share sheet with image file, or download fallback on desktop. */
export const shareImageBlob = async (
  blob: Blob,
  filename: string,
  options?: { title?: string; text?: string }
): Promise<ShareImageResult> => {
  const file = new File([blob], filename, { type: blob.type || 'image/png' });
  const canShareFiles =
    typeof navigator !== 'undefined' &&
    'share' in navigator &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] });

  if (canShareFiles) {
    try {
      await navigator.share({
        title: options?.title,
        text: options?.text,
        files: [file],
      });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'unsupported';
      }
    }
  }

  if (typeof document === 'undefined') return 'unsupported';

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return 'downloaded';
};
