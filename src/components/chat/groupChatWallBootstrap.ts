export type GroupChatWallBootstrap =
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'error'; message: string };

export const GROUP_CHAT_WALL_BOOTSTRAP_LOADING: GroupChatWallBootstrap = { kind: 'loading' };

export const groupChatWallBootstrapIsLoading = (status: GroupChatWallBootstrap): boolean =>
  status.kind === 'loading';

export const groupChatWallBootstrapError = (status: GroupChatWallBootstrap): string | null =>
  status.kind === 'error' ? status.message : null;