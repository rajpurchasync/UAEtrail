export const parseLanguagesList = (value: string | null | undefined): string[] => {
  if (!value?.trim()) return [];
  return [...new Set(value.split(',').map((part) => part.trim()).filter(Boolean))];
};

export const formatLanguages = (languages: string[]): string => languages.join(', ');
