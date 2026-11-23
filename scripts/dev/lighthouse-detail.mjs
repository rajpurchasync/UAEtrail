#!/usr/bin/env node
/**
 * Optional Lighthouse CI for detail routes (plan §15.1 targets as warnings).
 * Never invoked from verify:system:quick — that gate is `npm run verify:perf` (bundle graph).
 * PRs: .github/workflows/lighthouse.yml (build + vite preview + @lhci/cli collect/assert/upload).
 *
 * Runs when Chrome + @lhci/cli are installed and `dist/` exists:
 *   npm run build && npm run lighthouse:detail
 * Emulates a mid-tier Android phone on simulated 4G (plan §15.1).
 * Assertions are warn-mode (do not fail the process); missing tools skip locally (exit 0).
 * On GitHub Actions, missing Chrome/LHCI/dist/preview is a job failure (tool crash), not a skip.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const configPath = join(root, 'scripts', 'lighthouse-detail.config.json');
const distDir = join(root, 'dist');
const require = createRequire(import.meta.url);

const inCi = process.env.GITHUB_ACTIONS === 'true' || process.env.LHCI_REQUIRE === '1';

const skip = (reason) => {
  if (inCi) {
    console.error(`[lighthouse:detail] required in CI — ${reason}`);
    process.exit(1);
  }
  console.log(`[lighthouse:detail] skip — ${reason}`);
  process.exit(0);
};

const chromeCandidates = () => {
  const home = process.env.LOCALAPPDATA || '';
  const pf = process.env.PROGRAMFILES || 'C:\\Program Files';
  const pf86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
  return [
    process.env.CHROME_PATH,
    process.env.LIGHTHOUSE_CHROMIUM_PATH,
    join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    join(home, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/opt/google/chrome/chrome',
    '/opt/google/chrome/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
};

const resolveChrome = () => {
  for (const candidate of chromeCandidates()) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
};

const resolveLhci = () => {
  const specs = ['@lhci/cli/src/cli.js', '@lhci/cli/lib/cli.js', '@lhci/cli'];
  for (const spec of specs) {
    try {
      return require.resolve(spec);
    } catch {
      /* next */
    }
  }
  return null;
};

const waitForPreview = async (url, timeoutMs = 20_000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status > 0) return true;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  return false;
};

const run = (command, args, extraEnv) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, ...extraEnv },
      windowsHide: true,
    });
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  });

const chrome = resolveChrome();
if (!chrome) {
  skip('Chrome not found (install Chrome or set CHROME_PATH). Not part of verify:system:quick.');
}

const lhci = resolveLhci();
if (!lhci) {
  skip('LHCI not installed (@lhci/cli). PRs install it via npm ci; locally: npm i then npm run build && npm run lighthouse:detail');
}

if (!existsSync(distDir)) {
  skip('dist/ missing — run npm run build first, then npm run lighthouse:detail against vite preview.');
}

const resolveVite = () => {
  try {
    const pkg = require.resolve('vite/package.json');
    const bin = join(dirname(pkg), 'bin', 'vite.js');
    return existsSync(bin) ? bin : null;
  } catch {
    return null;
  }
};

const viteBin = resolveVite();
if (!viteBin) {
  skip('vite not installed — cannot preview dist/ for Lighthouse');
}

const preview = spawn(process.execPath, [viteBin, 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
  cwd: root,
  stdio: 'pipe',
  env: process.env,
});

let previewExit = null;
preview.on('exit', (code) => {
  previewExit = code;
});

try {
  const ready = await waitForPreview('http://127.0.0.1:4173/');
  if (!ready) {
    skip('vite preview on :4173 did not become ready');
  }
  if (previewExit != null && previewExit !== 0) {
    skip(`vite preview exited (${previewExit})`);
  }

  const lhciEnv = {
    CHROME_PATH: chrome,
    LHCI_BUILD_CONTEXT__CURRENT_HASH: process.env.GITHUB_SHA || 'local',
  };
  const collectCode = await run(process.execPath, [lhci, 'collect', `--config=${configPath}`], lhciEnv);
  if (collectCode !== 0) {
    console.error('[lighthouse:detail] LHCI collect failed (Chrome/preview/tool crash)');
    process.exit(collectCode);
  }
  const assertCode = await run(process.execPath, [lhci, 'assert', `--config=${configPath}`], lhciEnv);
  if (assertCode !== 0) {
    console.warn(
      '[lighthouse:detail] LHCI assert exited non-zero — warn-mode (plan §15.1); not failing the job'
    );
  }
  const uploadCode = await run(process.execPath, [lhci, 'upload', `--config=${configPath}`], lhciEnv);
  if (uploadCode !== 0) {
    console.error('[lighthouse:detail] LHCI upload failed (filesystem reports)');
    process.exit(uploadCode);
  }
  process.exit(0);
} finally {
  preview.kill();
}
