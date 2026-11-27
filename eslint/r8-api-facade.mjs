/**
 * R8.1 — mirror Vitest *ApiGuard tests (IDE feedback). Vitest remains CI source of truth.
 */

const HOOKS_NON_FACADE_ALLOWLIST = new Set([
  'src/hooks/activityJoinClientEffects.ts',
  'src/hooks/clientQueryKeys.ts',
  'src/hooks/exploreMapQuery.ts',
]);

const UI_LAYER_GLOBS = [
  'src/components/**/*.{ts,tsx}',
  'src/pages/**/*.{ts,tsx}',
  'src/explore/**/*.{ts,tsx}',
  'src/utils/**/*.{ts,tsx}',
  'src/list/**/*.{ts,tsx}',
  'src/services/**/*.{ts,tsx}',
  'src/operator/desk/**/*.{ts,tsx}',
];

export const r8UiLayerFiles = UI_LAYER_GLOBS;

export const r8HooksNonFacadeFiles = ['src/hooks/**/*.ts'];

function posixPath(context) {
  return context.filename.replace(/\\/g, '/');
}

function isHooksFacadeModule(file) {
  return /(?:ClientApi|Api)\.ts$/.test(file);
}

function isApiClientImport(source) {
  return typeof source === 'string' && /\/api\/client(?:\.ts)?$/.test(source.replace(/\\/g, '/'));
}

function isApiDomainsImport(source) {
  return typeof source === 'string' && /\/api\/domains\//.test(source.replace(/\\/g, '/'));
}

function isApiIndexImport(source) {
  if (typeof source !== 'string') return false;
  const normalized = source.replace(/\\/g, '/');
  return normalized.endsWith('/api/index') || normalized.endsWith('/api');
}

function reportApiUsage(context, node, message) {
  context.report({ node, message });
}

const DEFAULT_MESSAGE =
  'R8.1: call HTTP via src/hooks/*ClientApi or *Api facades — not api.* / apiRequest here.';

const HOOKS_MESSAGE =
  'R8.1: only *Api.ts / *ClientApi.ts modules under src/hooks may call api.* / apiRequest.';

export function createNoDirectApiFacadeRule(mode) {
  return {
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow direct api.* / apiRequest outside client facades (R8.1)',
      },
      schema: [],
    },
    create(context) {
      const file = posixPath(context);
      const message = mode === 'hooks' ? HOOKS_MESSAGE : DEFAULT_MESSAGE;

      if (mode === 'hooks') {
        if (isHooksFacadeModule(file)) return {};
        if (file.endsWith('.test.ts')) return {};
        if (HOOKS_NON_FACADE_ALLOWLIST.has(file)) {
          // Allowlisted paths must not use api — still lint them
        }
      }

      return {
        ImportDeclaration(node) {
          const src = node.source.value;
          if (mode !== 'hooks' && isApiClientImport(src)) {
            reportApiUsage(
              context,
              node,
              'R8.1: do not import api/client in UI layers — use a hooks facade.'
            );
            return;
          }
          if (mode !== 'hooks' && isApiDomainsImport(src)) {
            reportApiUsage(
              context,
              node,
              'R8.1: do not import api/domains in UI layers — use src/hooks/*{Api,ClientApi}.'
            );
            return;
          }
          if (mode !== 'hooks' && isApiIndexImport(src)) {
            reportApiUsage(
              context,
              node,
              'R8.1: do not import api/index in UI layers — use hooks facades or src/api/types.'
            );
          }
        },
        CallExpression(node) {
          const callee = node.callee;
          if (callee.type === 'Identifier' && callee.name === 'apiRequest') {
            reportApiUsage(context, node, message);
            return;
          }
          if (
            callee.type === 'MemberExpression' &&
            callee.object.type === 'Identifier' &&
            callee.object.name === 'api' &&
            callee.property.type === 'Identifier'
          ) {
            reportApiUsage(context, node, message);
          }
        },
        MemberExpression(node) {
          if (node.object.type !== 'Identifier' || node.object.name !== 'api') return;
          if (node.property.type !== 'Identifier') return;
          // Skip `api` in `api.foo()` — already reported on CallExpression
          if (node.parent?.type === 'CallExpression' && node.parent.callee === node) return;
          reportApiUsage(context, node, message);
        },
      };
    },
  };
}
