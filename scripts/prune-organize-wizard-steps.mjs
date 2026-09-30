/**
 * Strip unused imports and ctx destructuring fields from organize wizard step modules.
 * Run after split-wizard-steps-v3.mjs: node scripts/prune-organize-wizard-steps.mjs
 */
import fs from 'fs';
import path from 'path';

const STEPS_DIR = 'src/explore/ui/organizeWizard/steps';

const RESERVED = new Set([
  'React',
  'ReactNode',
  'null',
  'return',
  'if',
  'const',
  'true',
  'false',
  'className',
  'type',
  'key',
  'event',
  'string',
  'number',
  'boolean',
]);

function collectUsedIdentifiers(code) {
  const ids = new Set();
  const re = /\b[A-Za-z_$][A-Za-z0-9_$]*\b/g;
  let m;
  while ((m = re.exec(code))) ids.add(m[0]);
  return ids;
}

function wordUses(code, name) {
  if (RESERVED.has(name)) return false;
  const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
  return re.test(code);
}

function pruneImportBlock(block, used) {
  const fromMatch = block.match(/from\s+['"]([^'"]+)['"]\s*;?/);
  if (!fromMatch) return block;

  const from = fromMatch[1];
  const isTypeOnly = block.includes('import type');

  if (block.match(/import\s+type\s+\{([^}]+)\}/)) {
    const inner = block.match(/import\s+type\s+\{([^}]+)\}/)[1];
    const names = inner.split(',').map((p) => {
      const t = p.trim();
      const alias = t.split(/\s+as\s+/);
      return (alias[1] ?? alias[0]).trim();
    });
    const kept = names.filter((n) => used.has(n));
    if (kept.length === 0) return '';
    return `import type { ${names.filter((n, i) => kept.includes(names[i])).join(', ')} } from '${from}';`;
  }

  if (block.match(/import\s+\{([^}]+)\}\s+from/)) {
    const inner = block.match(/import\s+\{([^}]+)\}\s+from/)[1];
    const parts = inner.split(',').map((p) => p.trim()).filter(Boolean);
    const keptParts = [];
    for (const part of parts) {
      const typePrefix = part.startsWith('type ') ? 'type ' : '';
      const bare = part.replace(/^type\s+/, '').trim();
      const alias = bare.split(/\s+as\s+/);
      const local = (alias[1] ?? alias[0]).trim();
      const imported = alias[0].trim();
      if (used.has(local) || used.has(imported)) {
        keptParts.push(part);
      }
    }
    if (keptParts.length === 0) return '';
    return `import { ${keptParts.join(', ')} } from '${from}';`;
  }

  if (block.match(/import\s+(\w+)\s+from/)) {
    const name = block.match(/import\s+(\w+)\s+from/)[1];
    if (!used.has(name)) return '';
    return block.trim();
  }

  return block;
}

function splitImports(header) {
  const blocks = [];
  let current = '';
  let depth = 0;
  for (const line of header.split('\n')) {
    current += (current ? '\n' : '') + line;
    depth += (line.match(/\{/g) ?? []).length;
    depth -= (line.match(/\}/g) ?? []).length;
    if (line.includes('from ') && depth <= 0) {
      blocks.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) blocks.push(current.trim());
  return blocks.filter((b) => b.startsWith('import'));
}

function pruneStepFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const exportIdx = content.search(/export function render\w+Step/);
  if (exportIdx < 0) return;

  const header = content.slice(0, exportIdx);
  const tail = content.slice(exportIdx);

  const destructureMatch = tail.match(
    /const\s*\{([\s\S]*?)\}\s*=\s*ctx;\s*\n/
  );
  if (!destructureMatch) {
    console.warn('no destructure', filePath);
    return;
  }

  const bodyAfterDestructure = tail.slice(destructureMatch.index + destructureMatch[0].length);
  const destructureInner = destructureMatch[1];
  const names = destructureInner
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.split(':')[0].trim());

  const keptDestructure = names.filter((n) => wordUses(bodyAfterDestructure, n));
  const newDestructure = `  const {\n    ${keptDestructure.join(',\n    ')},\n  } = ctx;\n\n`;

  const tailWithDestructure =
    tail.slice(0, destructureMatch.index) +
    newDestructure +
    bodyAfterDestructure;

  const codeForImports = tailWithDestructure;
  const used = collectUsedIdentifiers(tail);
  for (const n of keptDestructure) used.add(n);

  // NextButton alias
  if (used.has('NextButton')) used.add('OrganizeWizardNextButton');
  if (wordUses(tail, 'FlowSheetChrome')) used.add('FlowSheetChrome');
  if (wordUses(tail, 'FlowStepTextInput')) used.add('FlowStepTextInput');
  if (wordUses(tail, 'setRouteMapTarget')) used.add('setRouteMapTarget');
  for (const name of [
    'MapPin',
    'Lock',
    'Users',
    'UserRound',
    'BadgeCheck',
    'ClipboardCheck',
    'MoreHorizontal',
    'Car',
    'Tent',
    'CalendarDays',
    'Mountain',
    'Clock3',
  ]) {
    if (wordUses(tail, name)) used.add(name);
  }

  const importBlocks = splitImports(header);
  const prunedImports = importBlocks
    .map((b) => pruneImportBlock(b, used))
    .filter(Boolean)
    .join('\n');

  // Keep non-import preamble (TYPE_OPTIONS, NextButton const) from header
  const preamble = header
    .split('\n')
    .filter((line) => !line.trim().startsWith('import') && !line.includes(' from '))
    .join('\n')
    .replace(/\/\*\* Wizard step[\s\S]*?\*\//, '')
    .trim();

  const preambleBlocks = [];
  const typeOptionsMatch = header.match(/const TYPE_OPTIONS[\s\S]*?];\s*\n/);
  if (typeOptionsMatch && wordUses(codeForImports, 'TYPE_OPTIONS')) {
    preambleBlocks.push(typeOptionsMatch[0].trim());
  }
  if (header.includes('const NextButton = OrganizeWizardNextButton')) {
    preambleBlocks.push('const NextButton = OrganizeWizardNextButton;');
  }

  const out = [
    prunedImports,
    preambleBlocks.length ? '\n' + preambleBlocks.join('\n\n') + '\n' : '',
    '\n',
    tailWithDestructure.trimStart(),
  ]
    .filter(Boolean)
    .join('\n');

  fs.writeFileSync(filePath, out.endsWith('\n') ? out : out + '\n');
}

for (const file of fs.readdirSync(STEPS_DIR)) {
  if (!file.endsWith('-step.tsx')) continue;
  pruneStepFile(path.join(STEPS_DIR, file));
  console.log('pruned', file);
}
