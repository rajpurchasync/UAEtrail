import { useMemo, useState } from 'react';
import { LANGUAGE_SUGGESTIONS } from '../../constants/languageSuggestions';

const isSelected = (languages: string[], language: string): boolean =>
  languages.some((item) => item.toLowerCase() === language.toLowerCase());

const toggleLanguage = (languages: string[], language: string): string[] => {
  if (isSelected(languages, language)) {
    return languages.filter((item) => item.toLowerCase() !== language.toLowerCase());
  }
  return [...languages, language];
};

interface SignupLanguagePickerProps {
  value: string[];
  onChange: (languages: string[]) => void;
}

export const SignupLanguagePicker = ({ value, onChange }: SignupLanguagePickerProps) => {
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
    <div className="space-y-3">
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => onChange(toggleLanguage(value, language))}
              className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
            >
              {language} ×
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-neutral-400">No languages yet.</p>
      )}

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
        placeholder="Search or type a language"
        className="ios-input w-full text-[16px] border border-neutral-300 bg-white"
      />

      <div className="flex flex-wrap gap-2">
        {suggestions.map((language) => (
          <button
            key={language}
            type="button"
            onClick={() => onChange(toggleLanguage(value, language))}
            className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:border-emerald-300 hover:bg-emerald-50"
          >
            + {language}
          </button>
        ))}
      </div>

      {search.trim() && !isSelected(value, search.trim()) && !suggestions.some((s) => s.toLowerCase() === query) ? (
        <button
          type="button"
          onClick={addCustom}
          className="text-sm font-semibold text-emerald-700"
        >
          Add “{search.trim()}”
        </button>
      ) : null}

    </div>
  );
};
