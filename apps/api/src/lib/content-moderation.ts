const linkPattern = /(?:https?:\/\/|www\.)\S+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:\/\S*)?/gi;
const phoneCandidatePattern = /\+?\d[\d\s().-]{6,}\d/g;

const redactMatches = (input: string, pattern: RegExp): string => input.replace(pattern, '[removed]');

const redactPhoneNumbers = (input: string): string =>
  input.replace(phoneCandidatePattern, (match) => {
    const digitCount = match.replace(/\D/g, '').length;
    return digitCount >= 7 ? '[removed]' : match;
  });

export const sanitizeUserGeneratedText = (input: string): string => {
  const withoutLinks = redactMatches(input, linkPattern);
  return redactPhoneNumbers(withoutLinks);
};
