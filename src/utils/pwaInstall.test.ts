import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { detectAndroidWebBrowser, resolveAndroidInstallSteps } from './pwaInstallGuide';
import { promptAndroidInstall, stashAndroidInstallPrompt } from './pwaInstallPrompt';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function pngSize(bytes: Buffer): { width: number; height: number } {
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe('android install prompt', () => {
  it('tells Chrome and Edge apart on Android', () => {
    const chrome =
      'Mozilla/5.0 (Linux; Android 16; SM-S942B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
    const edge =
      'Mozilla/5.0 (Linux; Android 16; SM-S942B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 EdgA/131.0.0.0';

    viUserAgent(chrome);
    expect(detectAndroidWebBrowser()).toBe('chrome');
    expect(resolveAndroidInstallSteps('chrome').steps.join(' ')).toMatch(/Install app/);

    viUserAgent(edge);
    expect(detectAndroidWebBrowser()).toBe('edge');
    expect(resolveAndroidInstallSteps('edge').notice).toMatch(/Edge/);
    expect(resolveAndroidInstallSteps('edge').steps.join(' ')).not.toMatch(/cannot be installed/);
  });

  it('sends insecure pages to https before install steps', () => {
    const guide = resolveAndroidInstallSteps('chrome', false);
    expect(guide.notice).toMatch(/https:\/\/uaetrail\.com/);
    expect(guide.steps[0]).toMatch(/^Open https:\/\/uaetrail\.com/);
  });

  it('calls the Chromium install prompt from a click', async () => {
    let prompted = false;
    stashAndroidInstallPrompt({
      prompt: () => {
        prompted = true;
        return Promise.resolve();
      },
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    } as unknown as Parameters<typeof stashAndroidInstallPrompt>[0]);

    expect(promptAndroidInstall()).toBe(true);
    expect(prompted).toBe(true);
    expect(promptAndroidInstall()).toBe(false);
  });
});

describe('pwa manifest installability', () => {
  it('ships PNG icons Chrome and Edge require, and no placeholder asset links', () => {
    const manifest = JSON.parse(readFileSync(join(root, 'public/manifest.webmanifest'), 'utf8')) as {
      display: string;
      prefer_related_applications?: boolean;
      icons: { src: string; sizes: string; type: string; purpose: string }[];
    };
    expect(manifest.display).toBe('standalone');
    expect(manifest.prefer_related_applications).toBe(false);

    const purposes = new Set(manifest.icons.map((icon) => icon.purpose));
    expect(purposes.has('any')).toBe(true);
    expect(purposes.has('maskable')).toBe(true);

    for (const icon of manifest.icons) {
      expect(icon.type).toBe('image/png');
      const [width, height] = icon.sizes.split('x').map(Number);
      const file = readFileSync(join(root, 'public', icon.src.replace(/^\//, '')));
      expect(pngSize(file)).toEqual({ width, height });
    }

    const assetLinks = JSON.parse(readFileSync(join(root, 'public/.well-known/assetlinks.json'), 'utf8'));
    expect(assetLinks).toEqual([]);
    expect(readFileSync(join(root, 'public/sw.js'), 'utf8')).toMatch(/addEventListener\('fetch'/);
    expect(readFileSync(join(root, 'public/sw.js'), 'utf8')).not.toMatch(/Response\.error/);
  });
});

function viUserAgent(ua: string) {
  Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
}
