import { groupWallBodySnippet, type GroupWallReplyPreviewDTO } from '@uaetrail/shared-types';

/** Shared reply quote shape for DMs and group wall presenters. */
export const buildGroupWallReplyPreview = (
  messageId: string,
  authorDisplayName: string,
  parentBody: string
): GroupWallReplyPreviewDTO => ({
  messageId,
  authorDisplayName,
  bodySnippet: groupWallBodySnippet(parentBody),
});
