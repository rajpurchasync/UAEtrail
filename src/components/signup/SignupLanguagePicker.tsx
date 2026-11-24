import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { LANGUAGE_SUGGESTIONS } from '../../constants/languageSuggestions';

const isSelected = (languages: string[] | undefined, language: string): boolean =>
  (languages ?? []).some((item) => item.toLowerCase() === language.toLowerCase());

const toggleLanguage = (languages: string[] | undefined, language: string): string[] => {
  const list = languages ?? [];
  if (isSelected(list, language)) {
    return list.filter((item) => item.toLowerCase() !== language.toLowerCase());
  }
  return [...list, language];
};

interface SignupLanguagePickerProps {
  value?: string[];
  onChange: (languages: string[]) => void;
}

export const SignupLanguagePicker = ({ value = [], onChange }: SignupLanguagePickerProps) => {
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();

  const suggestions = useMemo(() => {
    const available = LANGUAGE_SUGGESTIONS.filter((language) => !isSelected(value, language));
    if (!query) return available.slice(0, 8);
    return available.filter((language) => language.toLowerCase().includes(query)).slice(0, 10);
  }, [query, value]);

  const addCustom = () => {
    const trimmed = search.trim();
    if (!trimmed || isSelected(value, trimmed)) return;
    onChange([...value, trimmed]);
    setSearch('');
  };

  return (
    <div className="space-y-2.5">
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((language) => (
            <span
              key={language}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100"
            >
              {language}
              <button
                type="button"
                onClick={() => onChange(toggleLanguage(value, language))}
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-emerald-700/80 hover:bg-emerald-100/80"
                aria-label={`Remove ${language}`}
              >
                <X className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            addCustom();
          }
        }}
        placeholder="Language"
        className="ios-input w-full text-[16px]"
        autoComplete="off"
        enterKeyHint="done"
        aria-label="Add language"
      />

      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => onChange(toggleLanguage(value, language))}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-emerald-300 hover:bg-emerald-50/80"
            >
              + {language}
            </button>
          ))}
        </div>
      ) : null}

      {search.trim() && !isSelected(value, search.trim()) && !suggestions.some((s) => s.toLowerCase() === query) ? (
        <button
          type="button"
          onClick={addCustom}
          className="rounded-full border border-dashed border-emerald-300 bg-emerald-50/50 px-3 py-1.5 text-xs font-semibold text-emerald-800"
        >
          + {search.trim()}
        </button>
      ) : null}
    </div>
  );
};
