export const countWords = (text: string): number =>
  text.trim() ? text.trim().split(/\s+/).length : 0;
