import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const parseEnvFile = (filePath) => {
  const parsed = {};
  if (!existsSync(filePath)) {
    return parsed;
  }

  for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
};

const isPrivateIpv4 = (host) => {
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
  const octets = host.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  return (
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
  );
};

const extractHosts = (mongoUri) => {
  const match = mongoUri.match(/^mongodb(?:\+srv)?:\/\/(?:[^@/]+@)?([^/?]+)/i);
  if (!match) {
    throw new Error('MONGODB URI must start with mongodb:// or mongodb+srv://');
  }

  return match[1]
    .split(',')
    .map((host) => host.trim().replace(/^\[/, '').replace(/\]$/, ''))
    .map((host) => host.replace(/:\d+$/, '').toLowerCase())
    .filter(Boolean);
};

export const validateMongoUri = (mongoUri) => {
  const hosts = extractHosts(mongoUri);
  if (hosts.length === 0) {
    throw new Error('MONGODB URI does not contain a hostname');
  }

  for (const host of hosts) {
    if (host === 'localhost' || host === 'mongo' || host.endsWith('.local') || isPrivateIpv4(host)) {
      throw new Error('MONGODB_URI appears to point to a local/private MongoDB. Use a cloud MongoDB URI for this project.');
    }
  }
};

export const resolveRuntimeEnv = ({
  baseEnv = process.env,
  envFilePath = path.resolve(process.cwd(), '.env')
} = {}) => {
  const fileEnv = parseEnvFile(envFilePath);
  const getEnv = (key) => baseEnv[key] ?? fileEnv[key] ?? '';

  const rawRunEnv = (getEnv('RUN_ENV') || 'test').toLowerCase();
  const normalizedRunEnv = rawRunEnv === 'local' ? 'test' : rawRunEnv;

  if (!['test', 'staging', 'production'].includes(normalizedRunEnv)) {
    throw new Error('RUN_ENV must be one of: test, staging, production (local maps to test).');
  }

  const nodeEnv = normalizedRunEnv === 'production' ? 'production' : 'development';
  const selectedKey = normalizedRunEnv === 'production'
    ? 'MONGODB_URI_PROD'
    : normalizedRunEnv === 'staging'
      ? 'MONGODB_URI_STAGING'
      : 'MONGODB_URI_TEST';

  const selectedUri = getEnv(selectedKey);
  if (!selectedUri) {
    throw new Error(
      normalizedRunEnv === 'production'
        ? 'Missing MongoDB URI for RUN_ENV=production. Set MONGODB_URI_PROD.'
        : normalizedRunEnv === 'staging'
          ? 'Missing MongoDB URI for RUN_ENV=staging. Set MONGODB_URI_STAGING.'
          : 'Missing MongoDB URI for RUN_ENV=test/local. Set MONGODB_URI_TEST.'
    );
  }

  validateMongoUri(selectedUri);

  return {
    RUN_ENV: rawRunEnv,
    NODE_ENV: nodeEnv,
    MONGODB_URI_SOURCE: selectedKey,
    MONGODB_URI: selectedUri
  };
};

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  try {
    const resolved = resolveRuntimeEnv();
    for (const [key, value] of Object.entries(resolved)) {
      process.stdout.write(`${key}=${value}\n`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}