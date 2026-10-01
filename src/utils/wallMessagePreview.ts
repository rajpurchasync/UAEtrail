import { parseGroupWallMessageBody } from './groupWallReply';

/** Single-line inbox preview (strips reply quote wrapper). */
export const formatWallInboxPreview = (body: string): string => {
  const parsed = parseGroupWallMessageBody(body);
  const text = (parsed?.replyText ?? body).trim();
  const line = text.split('\n')[0] ?? '';
  return line.length > 160 ? `${line.slice(0, 157)}…` : line;
};
