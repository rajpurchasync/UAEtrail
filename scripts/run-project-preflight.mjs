import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const minNodeVersion = '20.19.0';
const minDockerVersion = '24.0.0';
const minComposeVersion = '2.0.0';

const semverLikePattern = /^v?\d+(?:\.\d+){0,3}(?:[-+].*)?$/i;

const parseVersion = (value) => value.replace(/^v/i, '').split(/[.-]/).map((part) => {
  const parsed = Number.parseInt(part, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
});

const compareVersions = (left, right) => {
  const leftParts = parseVersion(left);
  const rightParts = parseVersion(right);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;
    if (leftValue > rightValue) return 1;
    if (leftValue < rightValue) return -1;
  }

  return 0;
};

const canCompareAsSemver = (value) => semverLikePattern.test(String(value || '').trim());

const resolveCommand = (command) => {
  if (process.platform === 'win32' && command === 'npm') {
    return 'npm.cmd';
  }
  return command;
};

const runCommand = (command, args, options = {}) => {
  const result = spawnSync(resolveCommand(command), args, {
    cwd: rootDir,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...options
  });

  if (result.error) {
    throw result.error;
  }

  return result;
};

const readVersion = (command, args, label, pattern) => {
  const result = runCommand(command, args);
  if (result.status !== 0) {
    throw new Error(`${label} is not available. Install or repair it, then rerun the project launcher.`);
  }

  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  const match = output.match(pattern);
  if (!match) {
    throw new Error(`Could not determine the ${label} version from: ${output}`);
  }

  return match[1];
};

const ensureMinimumVersion = (label, installedVersion, minimumVersion) => {
  if (compareVersions(installedVersion, minimumVersion) < 0) {
    throw new Error(`${label} ${installedVersion} is too old. Install ${minimumVersion} or newer.`);
  }
};

const withInheritedStdio = { stdio: 'inherit' };

const sleepSync = (ms) => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

const sudoCommand = (args) => {
  const candidate = runCommand('sudo', ['-n', ...args], withInheritedStdio);
  if (candidate.status === 0) return candidate;

  throw new Error(`sudo -n ${args.join(' ')} failed. Re-run with sudo/admin rights to install Docker automatically.`);
};

const installDockerOnWindows = () => {
  const winget = runCommand('winget', [
    'install',
    '--id', 'Docker.DockerDesktop',
    '-e',
    '--accept-package-agreements',
    '--accept-source-agreements'
  ], withInheritedStdio);

  if (winget.status !== 0) {
    throw new Error('Docker Desktop installation via winget failed. Install Docker Desktop manually and rerun the launcher.');
  }
};

const installDockerOnMac = () => {
  const brew = runCommand('brew', ['install', '--cask', 'docker'], withInheritedStdio);
  if (brew.status !== 0) {
    throw new Error('Docker Desktop installation via Homebrew failed. Install Docker Desktop manually and rerun the launcher.');
  }
};

const installDockerOnLinux = () => {
  if (runCommand('bash', ['-lc', 'command -v apt-get >/dev/null 2>&1'], {}).status === 0) {
    sudoCommand(['apt-get', 'update']);
    sudoCommand(['apt-get', 'install', '-y', 'docker.io', 'docker-compose-plugin']);
    return;
  }

  if (runCommand('bash', ['-lc', 'command -v dnf >/dev/null 2>&1'], {}).status === 0) {
    sudoCommand(['dnf', 'install', '-y', 'docker', 'docker-compose-plugin']);
    return;
  }

  if (runCommand('bash', ['-lc', 'command -v yum >/dev/null 2>&1'], {}).status === 0) {
    sudoCommand(['yum', 'install', '-y', 'docker', 'docker-compose-plugin']);
    return;
  }

  throw new Error('No supported Linux package manager found for Docker installation. Install Docker Engine and Docker Compose plugin manually.');
};

const startDockerIfPossible = () => {
  if (process.platform === 'win32') {
    const serviceCheck = runCommand('sc', ['query', 'com.docker.service'], withInheritedStdio);
    if (serviceCheck.status === 0) {
      runCommand('sc', ['start', 'com.docker.service'], withInheritedStdio);
    }

    const desktopPaths = [
      path.join(process.env.ProgramFiles || '', 'Docker', 'Docker', 'Docker Desktop.exe'),
      path.join(process.env.LocalAppData || '', 'Programs', 'DockerDesktop', 'Docker Desktop.exe'),
      path.join(process.env.LocalAppData || '', 'Programs', 'Docker', 'Docker', 'Docker Desktop.exe')
    ];

    for (const desktopPath of desktopPaths) {
      if (existsSync(desktopPath)) {
        runCommand('powershell', ['-NoProfile', '-Command', `Start-Process -FilePath '${desktopPath}'`], withInheritedStdio);
        break;
      }
    }
    return;
  }

  if (process.platform === 'darwin') {
    runCommand('open', ['-a', 'Docker'], withInheritedStdio);
    return;
  }

  if (process.platform === 'linux') {
    if (runCommand('bash', ['-lc', 'command -v systemctl >/dev/null 2>&1'], {}).status === 0) {
      sudoCommand(['systemctl', 'start', 'docker']);
      return;
    }
    if (runCommand('bash', ['-lc', 'command -v service >/dev/null 2>&1'], {}).status === 0) {
      sudoCommand(['service', 'docker', 'start']);
    }
  }
};

const ensureDockerDaemonReady = () => {
  const maxAttempts = 90;
  const delayMs = 2000;

  let dockerInfo = runCommand('docker', ['info']);
  if (dockerInfo.status === 0) {
    return;
  }

  console.log('[preflight] Docker daemon is not reachable yet. Attempting to start Docker...');
  startDockerIfPossible();

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    sleepSync(delayMs);
    dockerInfo = runCommand('docker', ['info']);
    if (dockerInfo.status === 0) {
      console.log(`[preflight] Docker daemon is ready after ${attempt * 2}s.`);
      return;
    }
  }

  throw new Error('Docker daemon is still not reachable after waiting. Open Docker Desktop and rerun the launcher.');
};

const ensureDockerToolchain = () => {
  try {
    const dockerVersion = readVersion('docker', ['--version'], 'Docker CLI', /Docker version\s+([0-9]+\.[0-9]+\.[0-9]+)/i);
    ensureMinimumVersion('Docker CLI', dockerVersion, minDockerVersion);

    let composeVersion;
    try {
      composeVersion = readVersion('docker', ['compose', 'version', '--short'], 'Docker Compose', /([0-9]+\.[0-9]+\.[0-9]+)/);
    } catch {
      composeVersion = readVersion('docker', ['compose', 'version'], 'Docker Compose', /([0-9]+\.[0-9]+\.[0-9]+)/);
    }

    ensureMinimumVersion('Docker Compose', composeVersion, minComposeVersion);
    console.log(`[preflight] Docker CLI ${dockerVersion} OK (minimum ${minDockerVersion}).`);
    console.log(`[preflight] Docker Compose ${composeVersion} OK (minimum ${minComposeVersion}).`);
    ensureDockerDaemonReady();
    return;
  } catch {
    console.log('[preflight] Docker toolchain missing or outdated. Attempting automatic install...');
  }

  if (process.platform === 'win32') {
    installDockerOnWindows();
  } else if (process.platform === 'darwin') {
    installDockerOnMac();
  } else if (process.platform === 'linux') {
    installDockerOnLinux();
  } else {
    throw new Error(`Unsupported platform for Docker installation: ${process.platform}`);
  }

  startDockerIfPossible();

  const dockerVersion = readVersion('docker', ['--version'], 'Docker CLI', /Docker version\s+([0-9]+\.[0-9]+\.[0-9]+)/i);
  ensureMinimumVersion('Docker CLI', dockerVersion, minDockerVersion);

  let composeVersion;
  try {
    composeVersion = readVersion('docker', ['compose', 'version', '--short'], 'Docker Compose', /([0-9]+\.[0-9]+\.[0-9]+)/);
  } catch {
    composeVersion = readVersion('docker', ['compose', 'version'], 'Docker Compose', /([0-9]+\.[0-9]+\.[0-9]+)/);
  }

  ensureMinimumVersion('Docker Compose', composeVersion, minComposeVersion);
  console.log(`[preflight] Docker CLI ${dockerVersion} OK (minimum ${minDockerVersion}).`);
  console.log(`[preflight] Docker Compose ${composeVersion} OK (minimum ${minComposeVersion}).`);
  ensureDockerDaemonReady();
};

const ensureWorkspaceDependencies = () => {
  if (existsSync(path.join(rootDir, 'node_modules'))) {
    const outdatedResult = runCommand('npm', ['outdated', '--json', '--depth=0']);
    if (outdatedResult.status !== 0 && outdatedResult.status !== 1) {
      throw new Error('Failed to inspect workspace dependency versions with npm outdated.');
    }

    const output = (outdatedResult.stdout || '').trim();
    if (!output) {
      console.log('[preflight] Workspace dependencies already installed and satisfy prerequisite ranges.');
      return;
    }

    let outdated;
    try {
      outdated = JSON.parse(output);
    } catch {
      console.log('[preflight] Could not parse npm outdated output. Keeping current dependencies unchanged.');
      return;
    }

    const belowPrerequisite = Object.entries(outdated).filter(([, data]) => {
      if (!data || typeof data !== 'object') return false;
      const current = String(data.current ?? '').trim();
      const wanted = String(data.wanted ?? '').trim();
      if (!current || !wanted) return false;
      if (!canCompareAsSemver(current) || !canCompareAsSemver(wanted)) return false;
      return compareVersions(current, wanted) < 0;
    });

    if (belowPrerequisite.length === 0) {
      console.log('[preflight] Workspace dependencies already installed and meet minimum compatible versions.');
      return;
    }

    console.log('[preflight] Some dependencies are below prerequisite-compatible versions. Running npm install...');
    const installResult = runCommand('npm', ['install'], { stdio: 'inherit' });
    if (installResult.status !== 0) {
      throw new Error('npm install failed while upgrading dependencies to prerequisite-compatible versions.');
    }
    console.log('[preflight] Workspace dependencies upgraded to compatible versions.');
    return;
  }

  console.log('[preflight] Installing workspace dependencies with npm install...');
  const installResult = runCommand('npm', ['install'], { stdio: 'inherit' });
  if (installResult.status !== 0) {
    throw new Error('npm install failed. Fix the dependency issue and rerun the project launcher.');
  }
};

const main = () => {
  const nodeVersion = process.versions.node;
  ensureMinimumVersion('Node.js', nodeVersion, minNodeVersion);
  console.log(`[preflight] Node.js ${nodeVersion} OK (minimum ${minNodeVersion}).`);

  const npmVersion = readVersion('npm', ['--version'], 'npm', /(\d+\.\d+\.\d+)/);
  console.log(`[preflight] npm ${npmVersion} OK.`);

  ensureDockerToolchain();

  ensureWorkspaceDependencies();
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}