#!/usr/bin/env node
/**
 * W0 — shim burn-down baseline (code-first metrics; no Atlas/Docker required).
 * Writes scripts/governance/shim-burn-down-baseline.json
 *
 * Usage: npm run shim:baseline
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outPath = join(root, 'scripts/governance/shim-burn-down-baseline.json');

const walkFiles = (dir, acc = []) => {
  if (!existsSync(dir)) return acc;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === 'dist') continue;
      walkFiles(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
};

const countPatternInTree = (dir, pattern, extRe = /\.(ts|tsx|mjs|js)$/) => {
  let n = 0;
  for (const file of walkFiles(dir)) {
    if (!extRe.test(file)) continue;
    const text = readFileSync(file, 'utf8');
    const matches = text.match(pattern);
    if (matches) n += matches.length;
  }
  return n;
};

const countFilesMatching = (dir, fileNameRe, contentRe) => {
  const files = [];
  for (const file of walkFiles(dir)) {
    if (!fileNameRe.test(file)) continue;
    const rel = file.slice(root.length + 1).replace(/\\/g, '/');
    if (contentRe && !contentRe.test(readFileSync(file, 'utf8'))) continue;
    files.push(rel);
  }
  return files;
};

const guardTests = walkFiles(root).filter((f) => /Guard\.test\.ts$/i.test(f));
const apiSrc = join(root, 'apps/api/src');
const feSrc = join(root, 'src');

const registerPlaceAliasCalls = countPatternInTree(apiSrc, /registerPlaceAlias\s*\(/g);
const retiredPlaceLocationMounts = countPatternInTree(apiSrc, /mountRetiredPlaceLocationPaths\s*\(/g);
const participantIntentsRefs = countPatternInTree(apiSrc, /participant_intents|participant-intents/gi);
const seekingActivityModeRefs = countPatternInTree(apiSrc, /activityMode.*seeking|'seeking'/g);

const PARTICIPANT_INTENT_OPS_ALLOWLIST = new Set(
  [
    'apps/api/src/lib/collections.ts',
    'apps/api/src/lib/mongo-migrations.ts',
    'apps/api/src/lib/participant-intents-store.ts',
    'apps/api/src/lib/retired-seeking-storage-purge.ts',
    'apps/api/src/lib/seeking-storage-ops.ts',
  ].map((p) => p.replace(/\\/g, '/'))
);
const participantIntentPattern = /participant_intents|participant-intent|PARTICIPANT_INTENT/i;
const participantIntentOpsViolations = [];
for (const file of walkFiles(apiSrc)) {
  if (!/\.ts$/.test(file) || file.endsWith('.test.ts')) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  const text = readFileSync(file, 'utf8');
  if (!participantIntentPattern.test(text)) continue;
  if (!PARTICIPANT_INTENT_OPS_ALLOWLIST.has(rel)) participantIntentOpsViolations.push(rel);
}
const participantIntentOpsAllowlistOnly = participantIntentOpsViolations.length === 0;

const listBrowseUrlStateImportRe = /from ['"].*list\/browse\/browseListUrlState['"]/;
const browseListUrlStateImportViolations = [];
for (const file of walkFiles(feSrc)) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (rel.startsWith('src/list/browse/')) continue;
  if (rel === 'src/discovery/discoverySessionListUrl.ts') continue;
  if (listBrowseUrlStateImportRe.test(readFileSync(file, 'utf8'))) {
    browseListUrlStateImportViolations.push(rel);
  }
}

const useSafeAsyncEffectPages = countFilesMatching(
  join(feSrc, 'pages'),
  /\.tsx$/,
  /useSafeAsyncEffect/
);

const importsBrowseListUrlStateFrom = (dirRel) =>
  countFilesMatching(join(root, dirRel), /\.(ts|tsx)$/).filter((rel) => {
    const text = readFileSync(join(root, rel), 'utf8');
    if (!/from ['"].*list\/browse\/browseListUrlState['"]/.test(text)) return false;
    if (/discoverySessionListUrl/.test(text)) return false;
    return true;
  });

const exploreImportsBrowseListUrlState = importsBrowseListUrlStateFrom('src/explore');
const configImportsBrowseListUrlState = importsBrowseListUrlStateFrom('src/config');

const consoleUseSafeAsyncEffect = countFilesMatching(join(feSrc, 'console'), /\.tsx$/).filter((rel) =>
  /useSafeAsyncEffect/.test(readFileSync(join(root, rel), 'utf8'))
);

const countSafeAsyncInTree = (dirRel, fileRe) => {
  const files = [];
  for (const file of walkFiles(join(root, dirRel))) {
    if (!fileRe.test(file)) continue;
    if (/useSafeAsyncEffect/.test(readFileSync(file, 'utf8')) && !file.includes('useSafeAsyncEffect.ts')) {
      files.push(file.slice(root.length + 1).replace(/\\/g, '/'));
    }
  }
  return files;
};

const componentSafeAsync = countSafeAsyncInTree('src/components', /\.(tsx)$/);
const exploreUiSafeAsync = countSafeAsyncInTree('src/explore/ui', /\.(tsx)$/);
const useSafeAsyncEffectHookExists = existsSync(join(feSrc, 'hooks', 'useSafeAsyncEffect.ts'));

const baseline = {
  version: 1,
  generated: new Date().toISOString().slice(0, 10),
  description: 'Shim burn-down metrics. Regenerate: npm run shim:baseline',
  waves: {
    w0: {
      note: 'seeking:deploy-gate green when Mongo reachable (npm run seeking:deploy-gate or w1:local-gate)',
    },
    w1: {
      participantIntentsRefsInApiSrc: participantIntentsRefs,
      participantIntentOpsAllowlistOnly,
      participantIntentOpsViolations,
      seekingActivityModeRefsInApiSrc: seekingActivityModeRefs,
      deployGateStatus: 'ops — run npm run seeking:deploy-gate per environment',
      opsScripts: [
        'seeking:deploy-gate',
        'w1:local-gate',
        'mig-disco-reg:ops:preflight',
        'purge:seeking-legacy',
      ],
    },
    w2: {
      registerPlaceAliasCallSites: registerPlaceAliasCalls,
      retiredPlaceLocationMountSites: retiredPlaceLocationMounts,
    },
    w4: {
      exploreFilesImportingBrowseListUrlState: exploreImportsBrowseListUrlState.length,
      exploreImportList: exploreImportsBrowseListUrlState,
      configFilesImportingBrowseListUrlState: configImportsBrowseListUrlState.length,
      configImportList: configImportsBrowseListUrlState,
      browseListUrlStateImportsOutsideListBrowse: browseListUrlStateImportViolations.length,
      browseListUrlStateImportViolations,
    },
    w6: {
      pagesUsingUseSafeAsyncEffect: useSafeAsyncEffectPages.length,
      pageFiles: useSafeAsyncEffectPages,
      consoleFilesUsingUseSafeAsyncEffect: consoleUseSafeAsyncEffect.length,
      consoleFiles: consoleUseSafeAsyncEffect,
      componentFilesUsingUseSafeAsyncEffect: componentSafeAsync.length,
      componentFiles: componentSafeAsync,
      exploreUiFilesUsingUseSafeAsyncEffect: exploreUiSafeAsync.length,
      exploreUiFiles: exploreUiSafeAsync,
      useSafeAsyncEffectHookRetired: !useSafeAsyncEffectHookExists,
    },
  },
  governance: {
    guardTestFileCount: guardTests.length,
  },
  nextActions: [
    ...(registerPlaceAliasCalls > 0
      ? ['W2: delete registerPlaceAlias shim once legacy /locations routes are unused']
      : []),
    ...(!participantIntentOpsAllowlistOnly
      ? ['W1b: participant_intents refs outside ops allowlist — shrink to migration/purge/gate modules only']
      : []),
    ...(useSafeAsyncEffectHookExists ? ['W6d: delete src/hooks/useSafeAsyncEffect.ts after MIG-CLIENT-QUERY'] : []),
    ...(browseListUrlStateImportViolations.length > 0
      ? ['W4d: import browseListUrlState only from list/browse or discoverySessionListUrl facade']
      : []),
    ...(exploreImportsBrowseListUrlState.length > 0
      ? ['W4: import discovery params from src/discovery/discoverySessionParams.ts not list/']
      : []),
    ...(configImportsBrowseListUrlState.length > 0
      ? ['W4c: route config/nav through discovery session spine']
      : []),
    ...(useSafeAsyncEffectPages.length > 0 ? ['W6: migrate admin/publishing pages off useSafeAsyncEffect'] : []),
    ...(consoleUseSafeAsyncEffect.length > 0 ? ['W6b: migrate console shell off useSafeAsyncEffect'] : []),
    ...(componentSafeAsync.length > 0 || exploreUiSafeAsync.length > 0
      ? ['W6c: migrate shared components / explore UI off useSafeAsyncEffect']
      : []),
  ],
};

writeFileSync(outPath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
console.log(`[shim:baseline] wrote ${outPath}`);
console.log(JSON.stringify(baseline, null, 2));