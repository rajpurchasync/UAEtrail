#!/usr/bin/env node
/**
 * Staging release ops — one CI entry for eng wiring across S10e, S10f, P5, MIG-DISCO-REG.
 *
 * Usage:
 *   npm run release:ops:checklist   # CI — nested ops checklists + PRE_DEPLOY spine (no staging)
 *
 * @see releaseOpsProgramGuard · docs/PRE_DEPLOY_CHECKLIST.md
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const step = process.argv[2] ?? 'help';

const gitSha = () => {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
};

const run = (cmd) => {
  console.log(`\n▶ ${cmd}\n`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
};

const help = () => {
  const text = readFileSync(join(root, 'scripts/release-staging-ops.mjs'), 'utf8');
  const usage = text.match(/Usage:\n([\s\S]*?)\n \*\//)?.[1]?.trim() ?? '';
  console.log(usage || 'See scripts/release-staging-ops.mjs');
};

const WIRE_SCRIPTS = [
  'release:ops:checklist',
  's10f:ops:checklist',
  'mig-disco-reg:ops:checklist',
  'p5:slo-preflight',
  'p5:slo-smoke',
  's10e:staging-checklist',
  's10e:local-ratio',
];

/** CI + matrix resolver (`ops.release_checklist`). */
export function checklist() {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const missingScripts = WIRE_SCRIPTS.filter((id) => !pkg.scripts?.[id]);
  if (missingScripts.length > 0) {
    console.error(`[release:ops] checklist FAILED — missing scripts: ${missingScripts.join(', ')}`);
    process.exit(1);
  }
  const paths = [
    'scripts/s10f-staging-ops.mjs',
    'scripts/mig-disco-reg-staging-ops.mjs',
    'scripts/p5-slo-smoke.mjs',
    'scripts/s10e-staging-bbox-checklist.mjs',
    'src/config/p4bS10fProgramGuard.test.ts',
    'src/config/p5SloProgramGuard.test.ts',
    'src/config/migDiscoRegProgramGuard.test.ts',
    'src/config/releaseOpsProgramGuard.test.ts',
  ];
  for (const rel of paths) {
    if (!existsSync(join(root, rel))) {
      console.error(`[release:ops] checklist FAILED — missing ${rel}`);
      process.exit(1);
    }
  }
  const preDeploy = readFileSync(join(root, 'docs/PRE_DEPLOY_CHECKLIST.md'), 'utf8');
  const preDeployNeedles = [
    'release:ops:checklist',
    'p5:slo-smoke',
    's10e:staging-checklist',
    's10f:ops:print-routes',
    'mig-disco-reg:ops:preflight',
  ];
  const missingDeploy = preDeployNeedles.filter((n) => !preDeploy.includes(n));
  if (missingDeploy.length > 0) {
    console.error(`[release:ops] checklist FAILED — PRE_DEPLOY missing: ${missingDeploy.join(', ')}`);
    process.exit(1);
  }
  const program = JSON.parse(readFileSync(join(root, 'scripts/refactor-program.json'), 'utf8'));
  const statement = program.authorization?.statement ?? '';
  if (!statement.includes('S10f') || !statement.includes('P5 SLO') || !statement.includes('MIG-DISCO-REG')) {
    console.error('[release:ops] checklist FAILED — refactor-program authorization.statement missing ops gates');
    process.exit(1);
  }
  run('npm run s10f:ops:checklist');
  run('npm run mig-disco-reg:ops:checklist');
  console.log(
    '[release:ops] checklist OK — wiring green. Staging still needs: p5:slo-smoke, s10e promote, s10f:ops:print-routes, mig-disco-reg migrate+gate.'
  );
}

console.log(`[release:ops] commit ${gitSha()} · step=${step}`);

switch (step) {
  case 'checklist':
    checklist();
    break;
  case 'help':
  default:
    help();
    process.exitCode = step === 'help' ? 0 : 1;
}