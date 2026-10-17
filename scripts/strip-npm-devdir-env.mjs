/**
 * `devdir` is not a supported npm 11 config; Cursor/agent sandboxes may inject
 * NPM_CONFIG_DEVDIR. Strip it so child `npm` processes do not warn.
 */
export const stripNpmDevdirEnv = (env = process.env) => {
  const next = { ...env };
  for (const key of Object.keys(next)) {
    if (key.toLowerCase() === 'npm_config_devdir') {
      delete next[key];
    }
  }
  delete next.NPM_CONFIG_DEVDIR;
  return next;
};

/** Mutate current process env (call once at orchestrator entry). */
export const stripNpmDevdirFromProcess = () => {
  for (const key of Object.keys(process.env)) {
    if (key.toLowerCase() === 'npm_config_devdir') {
      delete process.env[key];
    }
  }
  delete process.env.NPM_CONFIG_DEVDIR;
};
