#!/usr/bin/env node
/**
 * Tier-1 documentation coherence — banned obsolete product phrases.
 * See docs/DOCS_GOVERNANCE.md
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const TIER1 = [
  'docs/NORTHSTAR.md',
  'docs/NAVIGATION.md',
  'docs/LANDING.md',
  'docs/CREATE_FLOW.md',
  'docs/MEMBER_MODEL.md',
  'docs/DOMAIN.md',
  'docs/ARCHITECTURE.md',
  'docs/API_ROUTING.md',
  'docs/DOCS_INDEX.md',
  'docs/DOCS_GOVERNANCE.md',
  'docs/SYSTEM_COHERENCE.md',
  'docs/DOMAIN_CANONICALS.md',
];

/** Files that may mention legacy paths in redirect/legacy tables only */
const LEGACY_PATH_ALLOWLIST = new Set(['docs/NAVIGATION.md', 'docs/DOMAIN.md']);

/** Former standalone docs — must remain one-line superseded stubs, not full duplicates */
const MERGED_STUBS = [
  'docs/NAMING_COHERENCE.md',
  'docs/SYSTEM_ALIGNMENT_MATRIX.md',
  'docs/NAMING_HOST_MEMBER.md',
];

/** Documents that intentionally list banned phrases as guidance */
const BANNED_PHRASE_ALLOWLIST = new Set(['docs/DOCS_GOVERNANCE.md']);

const BANNED = [
  { pattern: /\/become-host\?intent=/, label: 'Pro entry must use /profile/pro-membership, not /become-host?intent=' },
  { pattern: /profile chips route to `\/become-host/i, label: 'Update ENGINEERING-style chip routing to PRO_MEMBERSHIP_PATH' },
  { pattern: /request to become (a )?host/i, label: 'Buddy Organize is profile complete + canPublish, not host application' },
];

let failed = false;

for (const rel of TIER1) {
  const abs = join(root, rel);
  if (!existsSync(abs)) {
    console.error(`[verify:docs] missing Tier-1 file: ${rel}`);
    failed = true;
    continue;
  }
  if (BANNED_PHRASE_ALLOWLIST.has(rel)) {
    continue;
  }
  const text = readFileSync(abs, 'utf8');
  for (const { pattern, label } of BANNED) {
    if (LEGACY_PATH_ALLOWLIST.has(rel) && pattern.source.includes('become-host')) {
      continue;
    }
    if (pattern.test(text)) {
      console.error(`[verify:docs] ${rel}: ${label}`);
      failed = true;
    }
  }
}

for (const rel of MERGED_STUBS) {
  const abs = join(root, rel);
  if (!existsSync(abs)) continue;
  const text = readFileSync(abs, 'utf8');
  if (!/^>\s*\*\*Superseded/i.test(text.trim())) {
    console.error(`[verify:docs] ${rel}: must be a superseded stub — merge content into Tier-1 per DOCS_GOVERNANCE.md`);
    failed = true;
  }
  if (text.split('\n').filter((l) => l.trim()).length > 3) {
    console.error(`[verify:docs] ${rel}: stub too long — move body into canonical Tier-1 file`);
    failed = true;
  }
}

if (failed) {
  console.error('\n[verify:docs] FAILED — see docs/DOCS_GOVERNANCE.md');
  process.exit(1);
}

console.log('[verify:docs] Tier-1 OK');
