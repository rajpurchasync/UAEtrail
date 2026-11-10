import { resolveDemoActivitySeedContext } from './seed-demo-scheduled-activities.js';
import { runDevQaBundleSeed } from './seed-dev-qa-bundle.js';
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';

runCliScript(resolveCliScriptName(import.meta.url), async () => {
  const ctx = await resolveDemoActivitySeedContext();
  if (!ctx) {
    process.exitCode = 1;
    console.error('[seed] Dev QA bundle skipped — run full seed first (demo tenants missing)');
    return;
  }
  await runDevQaBundleSeed(ctx);
});
