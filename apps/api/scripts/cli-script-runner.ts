/**
 * One-shot CLI scripts: connect, run, tear down Redis/Mongo, append audit line, exit.
 *
 * Audit log (JSONL): `apps/api/logs/seed-script-runs.jsonl`
 * Override path: `SEED_SCRIPT_AUDIT_LOG`
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectMongo, disconnectMongo } from '../src/lib/mongo.js';
import { disconnectRedis } from '../src/lib/redis.js';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const defaultAuditLog = path.resolve(scriptsDir, '../logs/seed-script-runs.jsonl');

export type CliScriptOptions = {
  /** Connect Mongo before `main` (default true). */
  connectMongo?: boolean;
  /** Close Mongo after run (default true). */
  disconnectMongo?: boolean;
  /** Disconnect Redis after run so the process can exit (default true). */
  disconnectRedis?: boolean;
};

export const resolveCliScriptName = (importMetaUrl: string): string =>
  path.basename(fileURLToPath(importMetaUrl));

const auditLogPath = (): string =>
  process.env.SEED_SCRIPT_AUDIT_LOG?.trim() || defaultAuditLog;

const appendAuditEntry = (entry: Record<string, unknown>): void => {
  const line = `${JSON.stringify(entry)}\n`;
  try {
    const file = auditLogPath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, line, 'utf8');
  } catch (error) {
    console.warn(
      '[cli-script] audit log write failed:',
      error instanceof Error ? error.message : error
    );
  }
};

/**
 * Run a script body and always terminate the process (avoids hung Redis/Mongo handles).
 */
export const runCliScript = (
  scriptName: string,
  main: () => Promise<void>,
  options: CliScriptOptions = {}
): void => {
  const shouldConnectMongo = options.connectMongo !== false;
  const shouldDisconnectMongo = options.disconnectMongo !== false;
  const shouldDisconnectRedis = options.disconnectRedis !== false;
  const startedAt = Date.now();
  let errorMessage: string | undefined;

  void (async () => {
    if (shouldConnectMongo) await connectMongo();
    await main();
  })()
    .catch((error) => {
      process.exitCode = 1;
      errorMessage = error instanceof Error ? error.message : String(error);
      console.error(error);
    })
    .finally(async () => {
      if (shouldDisconnectMongo) {
        await disconnectMongo().catch((err) => {
          console.warn('[cli-script] mongo disconnect:', err instanceof Error ? err.message : err);
        });
      }
      if (shouldDisconnectRedis) {
        await disconnectRedis().catch((err) => {
          console.warn('[cli-script] redis disconnect:', err instanceof Error ? err.message : err);
        });
      }

      const exitCode = process.exitCode ?? 0;
      appendAuditEntry({
        at: new Date().toISOString(),
        script: scriptName,
        ok: exitCode === 0,
        exitCode,
        durationMs: Date.now() - startedAt,
        nodeEnv: process.env.NODE_ENV ?? null,
        ...(errorMessage ? { error: errorMessage } : {}),
      });

      process.exit(exitCode);
    });
};
