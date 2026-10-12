import { createNoDirectApiFacadeRule } from './r8-api-facade.mjs';

/** @type {import('eslint').ESLint.Plugin} */
const LEGACY_MESSAGING_API = {
  getInbox: 'Use messagingApi.getInbox from src/messaging',
  getConversations: 'Use messagingApi.getConversations from src/messaging',
  getMessages: 'Use messagingApi.direct.listMessages from src/messaging',
  sendMessage: 'Use messagingApi.direct.send from src/messaging',
  createChatStreamTicket: 'Use messagingApi.createStreamTicket from src/messaging',
  getMeGroupWall: 'Use messagingApi.crew.getWall from src/messaging',
  createMeGroupWallPost: 'Use messagingApi.crew.post from src/messaging',
  toggleMeGroupWallReaction: 'Use messagingApi.crew.toggleReaction from src/messaging',
  markMeGroupWallRead: 'Use messagingApi.crew.markWallRead from src/messaging',
};

const plugin = {
  meta: { name: 'eslint-plugin-uaetrail' },
  rules: {
    'no-direct-api-facade-ui': createNoDirectApiFacadeRule('ui'),
    'no-direct-api-facade-hooks': createNoDirectApiFacadeRule('hooks'),
    'no-legacy-messaging-api': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Disallow legacy api.* chat/wall calls outside src/api — use messagingApi from src/messaging',
        },
        schema: [],
      },
      create(context) {
        return {
          CallExpression(node) {
            const callee = node.callee;
            if (callee.type !== 'MemberExpression') return;
            if (callee.object.type !== 'Identifier' || callee.object.name !== 'api') return;
            if (callee.property.type !== 'Identifier') return;
            const hint = LEGACY_MESSAGING_API[callee.property.name];
            if (hint) {
              context.report({ node, message: hint });
            }
          },
          ImportDeclaration(node) {
            const src = node.source.value;
            if (typeof src !== 'string') return;
            if (/components\/messages\/[^'"]+/.test(src)) {
              context.report({
                node,
                message: 'Import thread UI from @/chat (src/components/chat), not components/messages/*',
              });
            }
          },
        };
      },
    },
  },
};

export default plugin;
