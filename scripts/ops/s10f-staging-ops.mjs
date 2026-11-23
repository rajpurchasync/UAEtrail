#!/usr/bin/env node
/**
 * S10f / P4b consumer-detail staging ops — human QA on staging; CI validates wiring only.
 *
 * Usage:
 *   npm run s10f:ops:checklist          # CI — package scripts + guard bundle (no BASE_URL)
 *   BASE_URL=https://staging npm run s10f:ops:print-routes   # manual QA matrix
 *
 * @see MIG-SURFACE-ACTIVITY-DETAIL · consumerDetailQaMatrixGuard · activityDetailS10fBridgeGuard
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
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
  const text = readFileSync(join(root, 'scripts/ops/s10f-staging-ops.mjs'), 'utf8');
  const usage = text.match(/Usage:\n([\s\S]*?)\n \*\//)?.[1]?.trim() ?? '';
  console.log(usage || 'See scripts/ops/s10f-staging-ops.mjs');
};

console.log(`[s10f:ops] commit ${gitSha()} · step=${step}`);

switch (step) {
  case 'print-routes':
    run('npm run consumer-detail:qa-routes');
    console.log(
      '\n[s10f:ops] Walk each route on staging; sign notification edge cases in notificationRouting.test.ts.\n'
    );
    break;
  case 'checklist': {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const required = ['consumer-detail:qa-routes', 's10f:qa-checklist', 's10f:ops:checklist'];
    const missing = required.filter((id) => !pkg.scripts?.[id]);
    if (missing.length > 0) {
      console.error(`[s10f:ops] checklist FAILED — missing scripts: ${missing.join(', ')}`);
      process.exit(1);
    }
    const paths = [
      'scripts/ops/consumer-detail-manual-qa-routes.mjs',
      'src/config/consumerDetailQaMatrixGuard.test.ts',
      'src/config/activityDetailS10fBridgeGuard.test.ts',
      'src/config/p4bS10fProgramGuard.test.ts',
    ];
    for (const rel of paths) {
      if (!existsSync(join(root, rel))) {
        console.error(`[s10f:ops] checklist FAILED — missing ${rel}`);
        process.exit(1);
      }
    }
    const verifyFe = readFileSync(join(root, 'scripts/verify/verify-domain-fe.mjs'), 'utf8');
    const guardBundle = [
      'consumerDetailQaMatrixGuard.test.ts',
      'activityDetailS10fBridgeGuard.test.ts',
      'p4bS10fProgramGuard.test.ts',
    ];
    const missingGuards = guardBundle.filter((g) => !verifyFe.includes(g));
    if (missingGuards.length > 0) {
      console.error(`[s10f:ops] checklist FAILED — verify:domain:fe missing: ${missingGuards.join(', ')}`);
      process.exit(1);
    }
    const preDeploy = readFileSync(join(root, 'docs/PRE_DEPLOY_CHECKLIST.md'), 'utf8');
    if (!preDeploy.includes('s10f:ops:print-routes') || !preDeploy.includes('s10f:ops:checklist')) {
      console.error('[s10f:ops] checklist FAILED — PRE_DEPLOY missing s10f:ops commands');
      process.exit(1);
    }
    const archive = JSON.parse(readFileSync(join(root, 'scripts/governance/platform-migration-archive.json'), 'utf8'));
    const mig = archive.migrations?.find((m) => m.id === 'MIG-SURFACE-ACTIVITY-DETAIL');
    if (!mig || mig.status !== 'complete') {
      console.error('[s10f:ops] checklist FAILED — MIG-SURFACE-ACTIVITY-DETAIL must be complete');
      process.exit(1);
    }
    console.log('[s10f:ops] checklist OK — eng wiring (run print-routes on staging with BASE_URL)');
    break;
  }
  case 'help':
  default:
    help();
    process.exitCode = step === 'help' ? 0 : 1;
}