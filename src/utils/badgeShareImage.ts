import { buildShareUrl } from './share';

export type BadgeShareCardInput = {
  displayName: string;
  badgeName: string;
  badgeDescription: string;
  badgeEmoji: string;
  sharePath: string;
};

const CARD_SIZE = 1080;
const PADDING = 88;

export const wrapCanvasLines = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines) break;
  }

  if (lines.length < maxLines && current) lines.push(current);

  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    const last = lines[maxLines - 1];
    let trimmed = last;
    while (trimmed.length > 3 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }
    lines[maxLines - 1] = `${trimmed}…`;
  }

  return lines;
};

const drawMedallion = (ctx: CanvasRenderingContext2D, emoji: string, cx: number, cy: number) => {
  const radius = 200;
  const ring = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  ring.addColorStop(0, '#fde68a');
  ring.addColorStop(1, '#f59e0b');

  ctx.beginPath();
  ctx.arc(cx, cy, radius + 14, 0, Math.PI * 2);
  ctx.fillStyle = ring;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#fffbeb';
  ctx.fill();

  ctx.font = '160px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, cx, cy + 8);
};

/** Renders a square story card PNG for social sharing. */
export const renderBadgeSharePng = async (input: BadgeShareCardInput): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_SIZE;
  canvas.height = CARD_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create share image');

  const bg = ctx.createLinearGradient(0, 0, CARD_SIZE, CARD_SIZE);
  bg.addColorStop(0, '#059669');
  bg.addColorStop(0.55, '#047857');
  bg.addColorStop(1, '#064e3b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.arc(CARD_SIZE * 0.85, CARD_SIZE * 0.12, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = '600 36px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText('UAE Trail', PADDING, PADDING + 36);

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '500 28px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText('Badge unlocked', PADDING, PADDING + 78);

  drawMedallion(ctx, input.badgeEmoji, CARD_SIZE / 2, CARD_SIZE * 0.42);

  const textMax = CARD_SIZE - PADDING * 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 52px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText(input.badgeName, CARD_SIZE / 2, CARD_SIZE * 0.66);

  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = '500 32px system-ui, -apple-system, Segoe UI, sans-serif';
  const descLines = wrapCanvasLines(ctx, input.badgeDescription, textMax, 2);
  descLines.forEach((line, index) => {
    ctx.fillText(line, CARD_SIZE / 2, CARD_SIZE * 0.72 + index * 40);
  });

  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '600 30px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText(input.displayName, CARD_SIZE / 2, CARD_SIZE * 0.82);

  const shareUrl = buildShareUrl(input.sharePath);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '500 24px system-ui, -apple-system, Segoe UI, sans-serif';
  const urlLine = shareUrl.replace(/^https?:\/\//, '');
  ctx.fillText(urlLine, CARD_SIZE / 2, CARD_SIZE - PADDING);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not encode share image'));
    }, 'image/png');
  });
};

export const badgeShareFilename = (badgeKey: string): string =>
  `uae-trail-badge-${badgeKey.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}.png`;
