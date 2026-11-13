#!/usr/bin/env node
/**
 * Advisory file locks for multi-agent editing in one working tree.
 * Cursor hooks call this; Claude Desktop (or any other agent) should use the same CLI.
 *
 * Usage:
 *   node .cursor/hooks/agent-file-lock.mjs acquire <rel-or-abs-path>
 *   node .cursor/hooks/agent-file-lock.mjs release <rel-or-abs-path>
 *   node .cursor/hooks/agent-file-lock.mjs check <rel-or-abs-path>
 *   node .cursor/hooks/agent-file-lock.mjs release-mine
 *   node .cursor/hooks/agent-file-lock.mjs pre-tool-use   # stdin JSON from Cursor hook
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LOCK_DIR = path.join(REPO_ROOT, '.cursor', 'agent-file-locks');
const TTL_MS = 20 * 60 * 1000;
const AGENT_ID =
  process.env.UAETRAIL_AGENT_ID?.trim() ||
  process.env.CURSOR_AGENT_ID?.trim() ||
  'cursor';

const ensureLockDir = () => {
  fs.mkdirSync(LOCK_DIR, { recursive: true });
};

const toRelPosix = (inputPath) => {
  const abs = path.isAbsolute(inputPath) ? inputPath : path.resolve(REPO_ROOT, inputPath);
  const rel = path.relative(REPO_ROOT, abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Path outside repo: ${inputPath}`);
  }
  return rel.split(path.sep).join('/');
};

const lockFileFor = (relPosix) => {
  const digest = crypto.createHash('sha1').update(relPosix).digest('hex').slice(0, 16);
  const safe = relPosix.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80);
  return path.join(LOCK_DIR, `${safe}__${digest}.lock.json`);
};

const readLock = (lockPath) => {
  try {
    return JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  } catch {
    return null;
  }
};

const isExpired = (lock) => !lock?.expiresAt || Date.parse(lock.expiresAt) <= Date.now();

const writeLock = (lockPath, relPosix) => {
  const now = Date.now();
  const payload = {
    path: relPosix,
    agentId: AGENT_ID,
    pid: process.pid,
    acquiredAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TTL_MS).toISOString(),
  };
  fs.writeFileSync(lockPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return payload;
};

const acquire = (inputPath) => {
  ensureLockDir();
  const rel = toRelPosix(inputPath);
  const lockPath = lockFileFor(rel);
  const existing = readLock(lockPath);
  if (existing && !isExpired(existing) && existing.agentId !== AGENT_ID) {
    return {
      ok: false,
      reason: 'held',
      lock: existing,
      message: `File locked by agent "${existing.agentId}" until ${existing.expiresAt}: ${rel}`,
    };
  }
  const lock = writeLock(lockPath, rel);
  return { ok: true, lock, message: `Locked ${rel} as ${AGENT_ID}` };
};

const release = (inputPath) => {
  ensureLockDir();
  const rel = toRelPosix(inputPath);
  const lockPath = lockFileFor(rel);
  const existing = readLock(lockPath);
  if (!existing) return { ok: true, message: `No lock for ${rel}` };
  if (existing.agentId !== AGENT_ID && !isExpired(existing)) {
    return {
      ok: false,
      reason: 'held',
      lock: existing,
      message: `Cannot release lock owned by "${existing.agentId}" for ${rel}`,
    };
  }
  fs.unlinkSync(lockPath);
  return { ok: true, message: `Released ${rel}` };
};

const check = (inputPath) => {
  ensureLockDir();
  const rel = toRelPosix(inputPath);
  const lockPath = lockFileFor(rel);
  const existing = readLock(lockPath);
  if (!existing || isExpired(existing)) {
    if (existing && isExpired(existing)) {
      try {
        fs.unlinkSync(lockPath);
      } catch {
        /* ignore */
      }
    }
    return { ok: true, free: true, path: rel };
  }
  return {
    ok: existing.agentId === AGENT_ID,
    free: false,
    lock: existing,
    path: rel,
    message:
      existing.agentId === AGENT_ID
        ? `Held by this agent (${AGENT_ID})`
        : `Held by "${existing.agentId}" until ${existing.expiresAt}`,
  };
};

const releaseMine = () => {
  ensureLockDir();
  let released = 0;
  for (const name of fs.readdirSync(LOCK_DIR)) {
    if (!name.endsWith('.lock.json')) continue;
    const lockPath = path.join(LOCK_DIR, name);
    const existing = readLock(lockPath);
    if (!existing) continue;
    if (existing.agentId === AGENT_ID || isExpired(existing)) {
      try {
        fs.unlinkSync(lockPath);
        released += 1;
      } catch {
        /* ignore */
      }
    }
  }
  return { ok: true, released, message: `Released ${released} lock(s) for ${AGENT_ID}` };
};

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
};

const extractEditPath = (toolName, toolInput) => {
  if (!toolInput || typeof toolInput !== 'object') return null;
  if (typeof toolInput.path === 'string' && toolInput.path.trim()) return toolInput.path.trim();
  if (typeof toolInput.file_path === 'string' && toolInput.file_path.trim()) {
    return toolInput.file_path.trim();
  }
  if (typeof toolInput.target_file === 'string' && toolInput.target_file.trim()) {
    return toolInput.target_file.trim();
  }
  // Some payloads nest under arguments
  if (toolInput.arguments && typeof toolInput.arguments === 'object') {
    return extractEditPath(toolName, toolInput.arguments);
  }
  return null;
};

const preToolUse = async () => {
  const raw = await readStdin();
  let payload = {};
  try {
    payload = JSON.parse(raw || '{}');
  } catch {
    process.stdout.write(`${JSON.stringify({ permission: 'allow' })}\n`);
    return;
  }

  const toolName = String(payload.tool_name ?? payload.toolName ?? '');
  const toolInput = payload.tool_input ?? payload.arguments ?? payload.input ?? {};
  const editTools = new Set(['Write', 'StrReplace', 'EditNotebook', 'Delete']);
  if (!editTools.has(toolName)) {
    process.stdout.write(`${JSON.stringify({ permission: 'allow' })}\n`);
    return;
  }

  const target = extractEditPath(toolName, toolInput);
  if (!target) {
    process.stdout.write(`${JSON.stringify({ permission: 'allow' })}\n`);
    return;
  }

  try {
    const result = acquire(target);
    if (!result.ok) {
      process.stdout.write(
        `${JSON.stringify({
          permission: 'deny',
          user_message: result.message,
          agent_message: `${result.message}. Stop editing this file until the other agent releases it, or use a separate git worktree.`,
        })}\n`
      );
      return;
    }
    process.stdout.write(
      `${JSON.stringify({
        permission: 'allow',
        agent_message: result.message,
      })}\n`
    );
  } catch (error) {
    process.stdout.write(
      `${JSON.stringify({
        permission: 'allow',
        agent_message: `Lock skipped: ${error instanceof Error ? error.message : String(error)}`,
      })}\n`
    );
  }
};

const main = async () => {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === 'pre-tool-use') {
    await preToolUse();
    return;
  }
  if (cmd === 'release-mine') {
    process.stdout.write(`${JSON.stringify(releaseMine(), null, 2)}\n`);
    return;
  }
  if (!arg) {
    console.error('Usage: acquire|release|check <path> | release-mine | pre-tool-use');
    process.exit(2);
  }
  if (cmd === 'acquire') {
    const result = acquire(arg);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exit(result.ok ? 0 : 2);
  }
  if (cmd === 'release') {
    const result = release(arg);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exit(result.ok ? 0 : 2);
  }
  if (cmd === 'check') {
    const result = check(arg);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exit(result.ok || result.free ? 0 : 2);
  }
  console.error(`Unknown command: ${cmd}`);
  process.exit(2);
};

await main();
