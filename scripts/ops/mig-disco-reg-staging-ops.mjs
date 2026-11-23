#!/usr/bin/env node
/**
 * MIG-DISCO-REG staging/VPS ops — run from repo root with the same `.env` as API.
 *
 * Usage:
 *   npm run mig-disco-reg:ops:preflight   # status + migrate dry-run (safe)
 *   npm run mig-disco-reg:ops:status
 *   npm run mig-disco-reg:ops:migrate-dry-run
 *   MIG_DISCO_REG_OPS_CONFIRM=1 npm run mig-disco-reg:ops:migrate
 *   MIG_DISCO_REG_OPS_CONFIRM=1 npm run mig-disco-reg:ops:migrate -- --cancel-seeking
 *   npm run mig-disco-reg:ops:gate
 *   npm run mig-disco-reg:ops:checklist  # CI — wiring only (no Mongo)
 *
 * Docker (API container has env + network):
 *   docker compose exec api npm run mig-disco-reg:ops:preflight
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const step = process.argv[2] ?? 'help';
const passThrough = process.argv.slice(3);

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

const requireConfirm = () => {
  if (process.env.MIG_DISCO_REG_OPS_CONFIRM !== '1') {
    console.error(
      '[mig-disco-reg:ops] Refusing destructive step. Re-run with MIG_DISCO_REG_OPS_CONFIRM=1'
    );
    process.exit(1);
  }
};

const printHeader = () => {
  console.log(`[mig-disco-reg:ops] commit ${gitSha()} · step=${step}`);
  console.log('[mig-disco-reg:ops] Ensure PRE_DEPLOY §2–2b backfill is green before migrate.');
};

const legacyBackfillIfNeeded = () => {
  const reportRaw = execSync('npm run seeking:storage-status', {
    cwd: root,
    encoding: 'utf8',
  });
  const jsonStart = reportRaw.indexOf('{');
  if (jsonStart < 0) return;
  const report = JSON.parse(reportRaw.slice(jsonStart));
  if (Number(report.activeIntentsMissingSeekingActivity) > 0) {
    console.warn(
      `\n[mig-disco-reg:ops] activeIntentsMissingSeekingActivity=${report.activeIntentsMissingSeekingActivity} — run backfill-seeking-activities before migrate.\n`
    );
  }
};

const help = () => {
  const text = readFileSync(join(root, 'scripts/ops/mig-disco-reg-staging-ops.mjs'), 'utf8');
  const usage = text.match(/Usage:\n([\s\S]*?)\n \*\//)?.[1]?.trim() ?? '';
  console.log(usage || 'See scripts/ops/mig-disco-reg-staging-ops.mjs');
};

printHeader();

switch (step) {
  case 'status':
    run('npm run seeking:storage-status');
    break;
  case 'migrate-dry-run':
    legacyBackfillIfNeeded();
    run('npm --workspace @uaetrail/api run migrate-seeking-to-availability -- --dry-run');
    break;
  case 'migrate': {
    requireConfirm();
    legacyBackfillIfNeeded();
    const cancel = passThrough.includes('--cancel-seeking');
    const args = cancel ? '-- --cancel-seeking' : '--';
    run(`npm --workspace @uaetrail/api run migrate-seeking-to-availability ${args}`);
    break;
  }
  case 'gate':
    run('npm run seeking:deploy-gate');
    break;
  case 'checklist': {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const required = [
      'seeking:storage-status',
      'seeking:deploy-gate',
      'mig-disco-reg:ops:preflight',
      'mig-disco-reg:ops:migrate',
      'mig-disco-reg:ops:gate',
    ];
    const missing = required.filter((id) => !pkg.scripts?.[id]);
    if (missing.length > 0) {
      console.error(`[mig-disco-reg:ops] checklist FAILED — missing scripts: ${missing.join(', ')}`);
      process.exit(1);
    }
    const apiPkg = JSON.parse(readFileSync(join(root, 'apps/api/package.json'), 'utf8'));
    if (!apiPkg.scripts?.['migrate-seeking-to-availability']) {
      console.error('[mig-disco-reg:ops] checklist FAILED — api migrate-seeking-to-availability script');
      process.exit(1);
    }
    if (!existsSync(join(root, 'apps/api/scripts/migrate-seeking-to-availability.ts'))) {
      console.error('[mig-disco-reg:ops] checklist FAILED — migrate-seeking-to-availability.ts missing');
      process.exit(1);
    }
    const runbook = readFileSync(join(root, 'docs/operations/SEEKING_STORAGE_RUNBOOK.md'), 'utf8');
    if (!runbook.includes('mig-disco-reg:ops:gate')) {
      console.error('[mig-disco-reg:ops] checklist FAILED — runbook missing gate command');
      process.exit(1);
    }
    console.log('[mig-disco-reg:ops] checklist OK — eng wiring (run gate on staging with Mongo)');
    break;
  }
  case 'preflight':
    run('npm run seeking:storage-status');
    legacyBackfillIfNeeded();
    run('npm --workspace @uaetrail/api run migrate-seeking-to-availability -- --dry-run');
    console.log(
      '\n[mig-disco-reg:ops] Preflight done. Review output, then:\n' +
        '  MIG_DISCO_REG_OPS_CONFIRM=1 npm run mig-disco-reg:ops:migrate\n' +
        '  npm run mig-disco-reg:ops:gate\n'
    );
    break;
  case 'help':
  default:
    help();
    process.exitCode = step === 'help' ? 0 : 1;
}