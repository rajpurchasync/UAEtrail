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
const seekingActivityModeLiteralAllow = new Set([
  'apps/api/src/domain/retired-seeking-activity-mode.ts',
]);
const seekingActivityModeLiteralRe = /['"]seeking['"]/;
const seekingActivityModeLiteralViolations = [];
for (const file of walkFiles(apiSrc)) {
  if (!/\.ts$/.test(file) || file.endsWith('.test.ts')) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  const text = readFileSync(file, 'utf8');
  if (!seekingActivityModeLiteralRe.test(text)) continue;
  if (seekingActivityModeLiteralAllow.has(rel)) continue;
  seekingActivityModeLiteralViolations.push(rel);
}
const seekingActivityModeRefs = countPatternInTree(apiSrc, /activityMode.*seeking|'seeking'/g);

const feActivityModeSeekingLiteralRe =
  /activityMode\s*(?:===|!==)\s*'seeking'|activityMode\s*\?\s*'[^']*'\s*:\s*[^;]*'seeking'/;
const feActivityModeSeekingLiteralViolations = [];
for (const file of walkFiles(feSrc)) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (feActivityModeSeekingLiteralRe.test(readFileSync(file, 'utf8'))) {
    feActivityModeSeekingLiteralViolations.push(rel);
  }
}

const loadParticipantIntentOpsAllowlistRepoRel = () => {
  const allowlistTs = join(root, 'apps/api/src/lib/participant-intent-ops-allowlist.ts');
  const text = readFileSync(allowlistTs, 'utf8');
  const block = text.match(
    /PARTICIPANT_INTENT_OPS_ALLOWLIST_API_REL\s*=\s*\[([\s\S]*?)\]\s*as\s+const/
  );
  if (!block) {
    throw new Error('W1e: parse PARTICIPANT_INTENT_OPS_ALLOWLIST_API_REL from participant-intent-ops-allowlist.ts');
  }
  return new Set(
    [...block[1].matchAll(/'([^']+)'/g)].map((m) => `apps/api/${m[1]}`.replace(/\\/g, '/'))
  );
};

const PARTICIPANT_INTENT_OPS_ALLOWLIST = loadParticipantIntentOpsAllowlistRepoRel();
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
const listBrowseSpineFromUrlStateReexport = [];
const spineImportRe =
  /import\s*\{[^}]*(?:LIST_CAT_PARAM|BROWSE_DISCOVER_PARAM|parseListCatParam)[^}]*\}\s*from\s*['"]\.\/browseListUrlState['"]/;
for (const file of walkFiles(join(root, 'src/list/browse'))) {
  if (!/\.tsx?$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (rel === 'src/list/browse/browseListUrlState.ts') continue;
  if (spineImportRe.test(readFileSync(file, 'utf8'))) listBrowseSpineFromUrlStateReexport.push(rel);
}

const browseListUrlStateImportViolations = [];
for (const file of walkFiles(feSrc)) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (rel.startsWith('src/list/browse/')) continue;
  if (rel === 'src/discovery/discoveryPortListUrl.ts') continue;
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
    if (/discoveryPortListUrl/.test(text)) return false;
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
const browseListUrlStateSource = existsSync(join(feSrc, 'list/browse/browseListUrlState.ts'))
  ? readFileSync(join(feSrc, 'list/browse/browseListUrlState.ts'), 'utf8')
  : '';
const browseListUrlStateReexportsSpineKeys = /export \{[^}]*LIST_CAT_PARAM/.test(browseListUrlStateSource);

const exploreSplitFacadeImportRe =
  /from ['"][^'"]*discovery\/discoverySession(?:Params|Parsers|ListUrl|GeoUrl|MapHandoff|ListRouting)['"]/;
const listBrowseSplitFacadeAllow = new Set(['src/list/browse/browseListUrlState.ts']);
const listBrowseSplitFacadeViolations = [];
for (const file of walkFiles(join(feSrc, 'list/browse'))) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (listBrowseSplitFacadeAllow.has(rel)) continue;
  if (exploreSplitFacadeImportRe.test(readFileSync(file, 'utf8'))) {
    listBrowseSplitFacadeViolations.push(rel);
  }
}

const exploreSplitFacadeViolations = [];
for (const file of walkFiles(join(feSrc, 'explore'))) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (exploreSplitFacadeImportRe.test(readFileSync(file, 'utf8'))) {
    exploreSplitFacadeViolations.push(rel);
  }
}

const exploreBrowseSpineBarrelViolations = [];
for (const rel of [
  'src/explore/exploreBrowseUrlHydrate.ts',
  'src/explore/exploreBrowseUrlSync.ts',
  'src/explore/search/exploreSearchRouting.ts',
  'src/config/desktopNav.ts',
  'src/config/mobileFiveTabNav.ts',
]) {
  const file = join(root, rel);
  if (!existsSync(file)) continue;
  const text = readFileSync(file, 'utf8');
  if (!/discovery\/discoverySession['"]/.test(text) && !/discovery\/discoverySession\b/.test(text)) {
    exploreBrowseSpineBarrelViolations.push(rel);
  }
  if (/discoverySessionParams['"]|discoverySessionParsers['"]|discoverySessionGeoUrl['"]/.test(text)) {
    exploreBrowseSpineBarrelViolations.push(`${rel} (split discovery import)`);
  }
}

const nonListBrowseListRoutingAllowPrefix = [
  'src/list/',
  'src/my-crew/',
  'src/discovery/discoveryPortListUrl.ts',
];
const consumerBrowseListRoutingViolations = [];
for (const file of walkFiles(feSrc)) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (nonListBrowseListRoutingAllowPrefix.some((p) => rel.startsWith(p) || rel === p)) continue;
  if (/list\/browse\/browseListRouting/.test(readFileSync(file, 'utf8'))) {
    consumerBrowseListRoutingViolations.push(rel);
  }
}

const w4jBrowseListRoutingViolations = [];
for (const rel of ['src/config/routingCatalog.ts', 'src/geo/GeoBrowsePane.tsx']) {
  const file = join(root, rel);
  if (!existsSync(file)) continue;
  if (/list\/browse\/browseListRouting/.test(readFileSync(file, 'utf8'))) {
    w4jBrowseListRoutingViolations.push(rel);
  }
}

const exploreImportsBrowseListRouting = [];
for (const file of walkFiles(join(feSrc, 'explore'))) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (/list\/browse\/browseListRouting/.test(readFileSync(file, 'utf8'))) {
    exploreImportsBrowseListRouting.push(rel);
  }
}

const exploreImportsBrowseListHooks = [];
for (const file of walkFiles(join(feSrc, 'explore'))) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (
    /list\/browse\/(?:useBrowseGeoScopeHydration|useBrowseListFeed|useBrowseViewerLocation|viewerLocationStorage)/.test(
      readFileSync(file, 'utf8')
    )
  ) {
    exploreImportsBrowseListHooks.push(rel);
  }
}

const exploreImportsBrowseListFilters = [];
for (const file of walkFiles(join(feSrc, 'explore'))) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (/list\/browse\/browseListFilters/.test(readFileSync(file, 'utf8'))) {
    exploreImportsBrowseListFilters.push(rel);
  }
}

const exploreImportsListChromeTheme = [];
for (const file of walkFiles(join(feSrc, 'explore'))) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (/list\/browse\/listChromeTheme/.test(readFileSync(file, 'utf8'))) {
    exploreImportsListChromeTheme.push(rel);
  }
}

const exploreListFeedImportRe =
  /list\/browse\/(?:buildListFeedCards|listBrowseSort|BrowseCompactRow|browseCardMeta|browseCardChrome)/;
const exploreMapPeekPathRe = /^src\/explore\/ui\/(?:peek|map-peek)\//;
const exploreImportsBrowseListFeed = [];
for (const file of walkFiles(join(feSrc, 'explore'))) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (exploreMapPeekPathRe.test(rel)) continue;
  if (exploreListFeedImportRe.test(readFileSync(file, 'utf8'))) {
    exploreImportsBrowseListFeed.push(rel);
  }
}

const listPeekListBrowsePattern =
  /list\/browse\/(?:browseCatalogLabels|browseCardMeta|browsePosterCover|placeDistance|venueBrowseFacts|listFeedFooterActions|tripBrowseCardCopy)/;
const listPeekDiscoveryBrowsePattern =
  /discovery\/browse\/(?:resolveDiscoveryBrowseListImageChrome|discoveryBrowseListChrome|DiscoveryBrowseCardMetaSlot)/;
const exploreImportsListPeek = [];
for (const sub of ['explore/ui/peek', 'explore/ui/map-peek']) {
  for (const file of walkFiles(join(feSrc, sub))) {
    if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
    const rel = file.slice(root.length + 1).replace(/\\/g, '/');
    const text = readFileSync(file, 'utf8');
    if (listPeekListBrowsePattern.test(text) || listPeekDiscoveryBrowsePattern.test(text)) {
      exploreImportsListPeek.push(rel);
    }
  }
}

const exploreListQuickFilterImportRe =
  /list\/browse\/(?:browseListBucket|browseListTripTopics|listVenuePlaceTopics|listQuickFilterPills|listBrowseFilterModal)/;
const exploreImportsBrowseListQuickFilters = [];
for (const file of walkFiles(join(feSrc, 'explore'))) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (exploreListQuickFilterImportRe.test(readFileSync(file, 'utf8'))) {
    exploreImportsBrowseListQuickFilters.push(rel);
  }
}

const exploreListPresentationImportRe =
  /list\/(?:explorer\/|ListDiscoveryExperience|crews\/CommunityDiscoverBrowseList)/;
const exploreImportsListPresentation = [];
for (const file of walkFiles(join(feSrc, 'explore'))) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (exploreListPresentationImportRe.test(readFileSync(file, 'utf8'))) {
    exploreImportsListPresentation.push(rel);
  }
}

const listDirectExploreImportRe = /from ['"][^'"]*explore\//;
const listImportsExploreDirect = [];
for (const file of walkFiles(join(feSrc, 'list'))) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (listDirectExploreImportRe.test(readFileSync(file, 'utf8'))) {
    listImportsExploreDirect.push(rel);
  }
}

const discoveryListFacadeImportAllowRe =
  /^src\/discovery\/discoverySession(?:List|GeoUrl|MapHandoff|PeopleUrl|FindCrew|Params|Parsers|Taxonomy|Explore)/;
const discoveryDirectListImportRe = /from ['"][^'"]*list\//;
const discoveryImportsListDirect = [];
for (const file of walkFiles(join(feSrc, 'discovery'))) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (discoveryListFacadeImportAllowRe.test(rel)) continue;
  if (discoveryDirectListImportRe.test(readFileSync(file, 'utf8'))) {
    discoveryImportsListDirect.push(rel);
  }
}

const listImportsDiscoveryRuntime = [];
for (const file of walkFiles(join(feSrc, 'list'))) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (/explore\/discoveryRuntime/.test(readFileSync(file, 'utf8'))) {
    listImportsDiscoveryRuntime.push(rel);
  }
}

const listImportsExploreActivityDate = [];
for (const file of walkFiles(join(feSrc, 'list'))) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (/explore\/exploreActivityDateFilter/.test(readFileSync(file, 'utf8'))) {
    listImportsExploreActivityDate.push(rel);
  }
}

const listImportsExploreSearch = [];
for (const file of walkFiles(join(feSrc, 'list'))) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (/explore\/search\//.test(readFileSync(file, 'utf8'))) {
    listImportsExploreSearch.push(rel);
  }
}

const exploreImportsBrowseGeoOrCopy = [];
for (const file of walkFiles(join(feSrc, 'explore'))) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (/list\/browse\/(?:browseGeoPath|browseListCopy)/.test(readFileSync(file, 'utf8'))) {
    exploreImportsBrowseGeoOrCopy.push(rel);
  }
}

const exploreImportsBrowseListTaxonomy = [];
for (const file of walkFiles(join(feSrc, 'explore'))) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (/list\/browse\/browseListTaxonomy/.test(readFileSync(file, 'utf8'))) {
    exploreImportsBrowseListTaxonomy.push(rel);
  }
}

const w4pBrowseListRoutingViolations = [];
for (const dir of ['my-crew', 'list/shell', 'list/explorer', 'list/crews']) {
  for (const file of walkFiles(join(feSrc, dir))) {
    if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
    const rel = file.slice(root.length + 1).replace(/\\/g, '/');
    if (/list\/browse\/browseListRouting/.test(readFileSync(file, 'utf8'))) {
      w4pBrowseListRoutingViolations.push(rel);
    }
  }
}

const exploreImportsPeopleListBrowseUrl = [];
for (const file of walkFiles(join(feSrc, 'explore'))) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (/list\/browse\/peopleListBrowseUrl/.test(readFileSync(file, 'utf8'))) {
    exploreImportsPeopleListBrowseUrl.push(rel);
  }
}

const exploreSearchMapHandoffViolations = [];
for (const file of walkFiles(join(feSrc, 'explore/search'))) {
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const rel = file.slice(root.length + 1).replace(/\\/g, '/');
  if (/browseListMapHandoff/.test(readFileSync(file, 'utf8'))) {
    exploreSearchMapHandoffViolations.push(rel);
  }
}

const exploreUrlSpineGeoViolations = [];
for (const rel of ['src/explore/exploreBrowseUrlHydrate.ts', 'src/explore/exploreBrowseUrlSync.ts']) {
  const file = join(root, rel);
  if (!existsSync(file)) continue;
  const text = readFileSync(file, 'utf8');
  if (/list\/browse\/browseGeoPath/.test(text)) exploreUrlSpineGeoViolations.push(rel);
}

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
      participantIntentOpsAllowlistFileCount: PARTICIPANT_INTENT_OPS_ALLOWLIST.size,
      participantIntentOpsAllowlistOnly,
      participantIntentOpsViolations,
      seekingActivityModeRefsInApiSrc: seekingActivityModeRefs,
      seekingActivityModeLiteralRefsInApiSrc: seekingActivityModeLiteralViolations.length,
      seekingActivityModeLiteralViolations,
      feActivityModeSeekingLiteralRefs: feActivityModeSeekingLiteralViolations.length,
      feActivityModeSeekingLiteralViolations,
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
      listBrowseSpineImportsViaUrlStateReexport: listBrowseSpineFromUrlStateReexport.length,
      listBrowseSpineImportViolations: listBrowseSpineFromUrlStateReexport,
      browseListUrlStateReexportsSpineKeys,
      exploreUrlSpineImportsBrowseGeoPath: exploreUrlSpineGeoViolations.length,
      exploreUrlSpineGeoViolations,
      exploreSearchImportsBrowseListMapHandoff: exploreSearchMapHandoffViolations.length,
      exploreSearchMapHandoffViolations,
      exploreImportsBrowseListRouting: exploreImportsBrowseListRouting.length,
      exploreBrowseListRoutingViolations: exploreImportsBrowseListRouting,
      exploreImportsPeopleListBrowseUrl: exploreImportsPeopleListBrowseUrl.length,
      explorePeopleListBrowseUrlViolations: exploreImportsPeopleListBrowseUrl,
      configGeoImportsBrowseListRouting: w4jBrowseListRoutingViolations.length,
      configGeoBrowseListRoutingViolations: w4jBrowseListRoutingViolations,
      consumerImportsBrowseListRoutingOutsideList: consumerBrowseListRoutingViolations.length,
      consumerBrowseListRoutingViolations,
      discoverySessionBarrelExists: existsSync(join(feSrc, 'discovery/discoverySession.ts')),
      exploreBrowseSpineUsesDiscoverySessionBarrel: exploreBrowseSpineBarrelViolations.length === 0,
      exploreBrowseSpineBarrelViolations,
      exploreSplitDiscoveryFacadeImports: exploreSplitFacadeViolations.length,
      exploreSplitFacadeViolations,
      listBrowseSplitDiscoveryFacadeImports: listBrowseSplitFacadeViolations.length,
      listBrowseSplitFacadeViolations,
      myCrewListShellBrowseListRoutingImports: w4pBrowseListRoutingViolations.length,
      myCrewListShellBrowseListRoutingViolations: w4pBrowseListRoutingViolations,
      exploreImportsBrowseListTaxonomy: exploreImportsBrowseListTaxonomy.length,
      exploreBrowseListTaxonomyViolations: exploreImportsBrowseListTaxonomy,
      exploreImportsBrowseGeoOrCopy: exploreImportsBrowseGeoOrCopy.length,
      exploreBrowseGeoOrCopyViolations: exploreImportsBrowseGeoOrCopy,
      exploreImportsBrowseListHooks: exploreImportsBrowseListHooks.length,
      exploreBrowseListHooksViolations: exploreImportsBrowseListHooks,
      exploreImportsBrowseListFilters: exploreImportsBrowseListFilters.length,
      exploreBrowseListFiltersViolations: exploreImportsBrowseListFilters,
      exploreImportsListChromeTheme: exploreImportsListChromeTheme.length,
      exploreListChromeThemeViolations: exploreImportsListChromeTheme,
      exploreImportsBrowseListFeed: exploreImportsBrowseListFeed.length,
      exploreBrowseListFeedViolations: exploreImportsBrowseListFeed,
      exploreImportsListPeek: exploreImportsListPeek.length,
      exploreListPeekViolations: exploreImportsListPeek,
      exploreImportsBrowseListQuickFilters: exploreImportsBrowseListQuickFilters.length,
      exploreBrowseListQuickFilterViolations: exploreImportsBrowseListQuickFilters,
      exploreImportsListPresentation: exploreImportsListPresentation.length,
      exploreListPresentationViolations: exploreImportsListPresentation,
      listImportsExploreSearch: listImportsExploreSearch.length,
      listExploreSearchImportViolations: listImportsExploreSearch,
      listImportsExploreActivityDate: listImportsExploreActivityDate.length,
      listExploreActivityDateImportViolations: listImportsExploreActivityDate,
      listImportsDiscoveryRuntime: listImportsDiscoveryRuntime.length,
      listDiscoveryRuntimeImportViolations: listImportsDiscoveryRuntime,
      listImportsExploreDirect: listImportsExploreDirect.length,
      listExploreDirectImportViolations: listImportsExploreDirect,
      discoveryImportsListDirect: discoveryImportsListDirect.length,
      discoveryListDirectImportViolations: discoveryImportsListDirect,
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
    ...(seekingActivityModeLiteralViolations.length > 0
      ? ['W1c: activityMode seeking literal only in domain/retired-seeking-activity-mode.ts']
      : []),
    ...(feActivityModeSeekingLiteralViolations.length > 0
      ? ['W1d: FE uses isRetiredSeekingActivityModeValue / exploreMapItemIsRetiredSeekingActivity']
      : []),
    ...(useSafeAsyncEffectHookExists ? ['W6d: delete src/hooks/useSafeAsyncEffect.ts after MIG-CLIENT-QUERY'] : []),
    ...(browseListUrlStateImportViolations.length > 0
      ? ['W4d: import browseListUrlState only from list/browse or discoveryPortListUrl facade']
      : []),
    ...(listBrowseSpineFromUrlStateReexport.length > 0
      ? ['W4e: list/browse must import spine keys from discoverySessionParams/Parsers']
      : []),
    ...(browseListUrlStateReexportsSpineKeys
      ? ['W4f: stop re-exporting spine keys from browseListUrlState — use discoveryPortListUrl']
      : []),
    ...(exploreUrlSpineGeoViolations.length > 0
      ? ['W4g: explore browse URL hydrate/sync import geo via discoverySessionGeoUrl']
      : []),
    ...(exploreSearchMapHandoffViolations.length > 0
      ? ['W4h: explore/search uses discoverySessionMapHandoff for list state scoping']
      : []),
    ...(exploreImportsBrowseListRouting.length > 0
      ? ['W4i: explore imports /list routing via discoveryPortListUrl']
      : []),
    ...(w4jBrowseListRoutingViolations.length > 0
      ? ['W4j: routingCatalog + GeoBrowsePane use discoveryPortListUrl']
      : []),
    ...(consumerBrowseListRoutingViolations.length > 0
      ? ['W4k: list/browse routing only in list|my-crew — use discoverySession* facades elsewhere']
      : []),
    ...(exploreBrowseSpineBarrelViolations.length > 0
      ? ['W4l: explore browse URL spine imports discoverySession barrel']
      : []),
    ...(exploreSplitFacadeViolations.length > 0
      ? ['W4m: explore imports discoverySession barrel only']
      : []),
    ...(listBrowseSplitFacadeViolations.length > 0
      ? ['W4n: list/browse uses discoverySession barrel (browseListUrlState impl exempt)']
      : []),
    ...(exploreImportsPeopleListBrowseUrl.length > 0
      ? ['W4o: explore imports people list URL via discoverySessionPeopleUrl barrel']
      : []),
    ...(w4pBrowseListRoutingViolations.length > 0
      ? ['W4p: my-crew/list shell routes via discoverySession barrel']
      : []),
    ...(exploreImportsBrowseListTaxonomy.length > 0
      ? ['W4q: explore imports BrowseMainCategoryKey via discoverySessionTaxonomy']
      : []),
    ...(exploreImportsBrowseGeoOrCopy.length > 0
      ? ['W4r: explore imports browse geo/FAB copy via discoverySession facades']
      : []),
    ...(exploreImportsBrowseListHooks.length > 0
      ? ['W4s: explore imports list browse hooks via discoveryPortListGeoHub']
      : []),
    ...(exploreImportsBrowseListFilters.length > 0
      ? ['W4t: explore imports browse list filter types via discoveryPortListBrowseFilters']
      : []),
    ...(exploreImportsListChromeTheme.length > 0
      ? ['W4u: explore imports list chrome via discoveryPortListBrowseCard']
      : []),
    ...(exploreImportsBrowseListFeed.length > 0
      ? ['W7a: explore imports list feed rows via discoveryPortListFeed (map peek exempt)']
      : []),
    ...(exploreImportsListPeek.length > 0
      ? ['W7b: explore map peek imports list chrome via discoveryPortListPeek']
      : []),
    ...(exploreImportsBrowseListQuickFilters.length > 0
      ? ['W8: explore imports list quick filters via discoveryPortListBrowseFilters']
      : []),
    ...(exploreImportsListPresentation.length > 0
      ? ['W9: explore imports list explorer/shell via discoverySession list presentation facades']
      : []),
    ...(listImportsExploreSearch.length > 0
      ? ['W10: list imports explore search via discoveryPortExploreSearch']
      : []),
    ...(listImportsExploreActivityDate.length > 0
      ? ['W11: list imports explore activity date via discoveryPortExploreOptionalFilterWire']
      : []),
    ...(listImportsDiscoveryRuntime.length > 0
      ? ['W12: list imports map catalog via discoveryPortExploreRuntime']
      : []),
    ...(listImportsExploreDirect.length > 0
      ? [
          'W14: list UI/compose/map-chrome explore imports — split facades (no discoverySession barrel); W13 wire done',
        ]
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