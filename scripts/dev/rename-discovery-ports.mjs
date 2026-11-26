#!/usr/bin/env node
/**
 * W29 — rename discoverySessionExplore/List port files → discoveryPortExplore/List
 * and rewrite imports. Spine: discoverySession.ts, discoverySessionParams*, discoverySessionParsers*.
 */
import { existsSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const discoveryDir = join(root, 'src/discovery');

const portExploreTargets = readdirSync(discoveryDir)
  .filter((f) => f.startsWith('discoveryPortExplore') && f.endsWith('.ts') && !f.endsWith('.test.ts'))
  .map((f) => f.replace(/^discoveryPortExplore/, 'discoverySessionExplore'));

for (const legacyName of portExploreTargets) {
  const legacyPath = join(discoveryDir, legacyName);
  if (existsSync(legacyPath)) {
    console.log(`remove duplicate legacy ${legacyName}`);
    unlinkSync(legacyPath);
  }
}

const renamePrefix = (oldPrefix, newPrefix) => {
  const ents = readdirSync(discoveryDir).filter(
    (f) => f.startsWith(oldPrefix) && f.endsWith('.ts') && !f.endsWith('.test.ts')
  );
  for (const ent of ents) {
    const newName = newPrefix + ent.slice(oldPrefix.length);
    if (newName === ent) continue;
    if (existsSync(join(discoveryDir, newName))) {
      console.warn(`skip ${ent} — ${newName} exists`);
      continue;
    }
    renameSync(join(discoveryDir, ent), join(discoveryDir, newName));
    console.log(`${ent} → ${newName}`);
  }
};

renamePrefix('discoverySessionExplore', 'discoveryPortExplore');
renamePrefix('discoverySessionList', 'discoveryPortList');

const SPINE_SKIP = new Set([
  'discoverySessionParams.ts',
  'discoverySessionParsers.ts',
  'discoverySessionGeoUrl.ts',
]);

const rewriteContent = (content) => {
  let next = content;
  next = next.replaceAll('@/discovery/discoverySessionExplore', '@/discovery/discoveryPortExplore');
  next = next.replaceAll('@/discovery/discoverySessionList', '@/discovery/discoveryPortList');
  next = next.replaceAll('discovery/discoverySessionExplore', 'discovery/discoveryPortExplore');
  next = next.replaceAll('discovery/discoverySessionList', 'discovery/discoveryPortList');
  next = next.replaceAll('./discoverySessionExplore', './discoveryPortExplore');
  next = next.replaceAll('./discoverySessionList', './discoveryPortList');
  next = next.replaceAll('../discoverySessionExplore', '../discoveryPortExplore');
  next = next.replaceAll('../discoverySessionList', '../discoveryPortList');
  next = next.replaceAll('discoverySessionExplore', 'discoveryPortExplore');
  next = next.replaceAll('discoverySessionList', 'discoveryPortList');
  return next;
};

const walk = (dir) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(full);
    } else if (/\.(ts|tsx|mjs|json)$/.test(ent.name)) {
      const rel = relative(root, full);
      if (rel.endsWith('rename-discovery-ports.mjs')) continue;
      if (rel === 'src/discovery/discoverySession.ts') {
        const content = readFileSync(full, 'utf8');
        const next = rewriteContent(content);
        if (next !== content) writeFileSync(full, next, 'utf8');
        console.log('updated', rel);
        continue;
      }
      if (rel.startsWith('src/discovery/') && SPINE_SKIP.has(ent.name)) continue;
      const content = readFileSync(full, 'utf8');
      if (!content.includes('discoverySessionExplore') && !content.includes('discoverySessionList')) continue;
      const next = rewriteContent(content);
      if (next !== content) {
        writeFileSync(full, next, 'utf8');
        console.log('updated', rel);
      }
    }
  }
};

walk(join(root, 'src'));
walk(join(root, 'scripts'));
console.log('W29 rename complete');