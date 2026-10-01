import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/index';
import { AppButton } from '../mobile/AppButton';
import { GlassCard } from '../mobile/GlassCard';
import { SettingsMenuRow } from '../settings/SettingsMenuRow';
import { Dialog } from '../ui/Dialog';
import { formatLanguages, parseLanguagesList } from '../../utils/profileLanguages';

import { LANGUAGE_SUGGESTIONS } from '../../constants/languageSuggestions';
const isLanguageSelected = (languages: string[], language: string): boolean =>
  languages.some((item) => item.toLowerCase() === language.toLowerCase());

const addLanguage = (languages: string[], language: string): string[] => {
  const trimmed = language.trim();
  if (!trimmed || isLanguageSelected(languages, trimmed)) return languages;
  return [...languages, trimmed];
};

const removeLanguage = (languages: string[], language: string): string[] =>
  languages.filter((item) => item.toLowerCase() !== language.toLowerCase());

interface ProfileLanguagesCardProps {
  languages: string | null;
  canEdit: boolean;
  onUpdated: (languages: string) => void;
  variant?: 'card' | 'hubRow' | 'inline';
}

export const ProfileLanguagesCard = ({
  languages,
  canEdit,
  onUpdated,
  variant = 'card',
}: ProfileLanguagesCardProps) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayedLanguages = useMemo(() => parseLanguagesList(languages), [languages]);

  useEffect(() => {
    if (!open) return;
    setSelected(parseLanguagesList(languages));
    setSearch('');
    setError(null);
  }, [languages, open]);

  const openEditor = () => {
    if (!canEdit) return;
    setOpen(true);
  };

  const query = search.trim().toLowerCase();

  const suggestions = useMemo(() => {
    const available = LANGUAGE_SUGGESTIONS.filter((language) => !isLanguageSelected(selected, language));
    if (!query) return available.slice(0, 6);
    return available.filter((language) => language.toLowerCase().includes(query)).slice(0, 8);
  }, [query, selected]);

  const canAddCustom =
    query.length >= 2 &&
    !isLanguageSelected(selected, query) &&
    !LANGUAGE_SUGGESTIONS.some((language) => language.toLowerCase() === query);

  const pickLanguage = (language: string) => {
    setSelected((prev) => addLanguage(prev, language));
    setSearch('');
    setError(null);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (suggestions[0]) {
      pickLanguage(suggestions[0]);
      return;
    }
    if (canAddCustom) {
      pickLanguage(search.trim());
    }
  };

  const saveLanguages = async () => {
    if (selected.length === 0) {
      setError('Add at least one language.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const formatted = formatLanguages(selected);
      await api.updateMeProfile({ languages: formatted });
      onUpdated(formatted);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save languages.');
    } finally {
      setSaving(false);
    }
  };

  const speaksSubtitle =
    displayedLanguages.length > 0
      ? displayedLanguages.join(', ')
      : 'Add the languages you speak on activities';

  return (
    <>
      {variant === 'inline' ? (
        canEdit ? (
          <button type="button" onClick={openEditor} className="flex w-full flex-wrap items-center gap-1.5 text-left active:opacity-80">
            <span className="text-xs font-semibold text-neutral-500">Speaks</span>
            {displayedLanguages.length > 0 ? (
              displayedLanguages.map((language) => (
                <span
                  key={language}
                  className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
                >
                  {language}
                </span>
              ))
            ) : (
              <span className="text-xs font-medium text-emerald-700">Add languages</span>
            )}
          </button>
        ) : displayedLanguages.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-neutral-500">Speaks</span>
            {displayedLanguages.map((language) => (
              <span
                key={language}
                className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
              >
                {language}
              </span>
            ))}
          </div>
        ) : null
      ) : variant === 'hubRow' ? (
        canEdit ? (
          <SettingsMenuRow label="Speaks" subtitle={speaksSubtitle} onClick={openEditor} />
        ) : (
          <SettingsMenuRow label="Speaks" subtitle={speaksSubtitle} />
        )
      ) : canEdit ? (
        <button type="button" onClick={openEditor} className="block w-full text-left">
          <GlassCard padding className="animate-fade-up transition-opacity active:opacity-90">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-neutral-800">Speaks</h3>
              <span
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-base shadow-sm ring-1 ring-neutral-200/90"
                aria-hidden
              >
                ✏️
              </span>
            </div>
            {displayedLanguages.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {displayedLanguages.map((language) => (
                  <span
                    key={language}
                    className="max-w-full truncate rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100"
                  >
                    {language}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">Add the languages you speak on activities</p>
            )}
          </GlassCard>
        </button>
      ) : (
        <GlassCard padding className="animate-fade-up">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-neutral-800">Speaks</h3>
            <Link to="/become-host" className="text-xs font-semibold text-emerald-600">
              Add
            </Link>
          </div>
          {displayedLanguages.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {displayedLanguages.map((language) => (
                <span
                  key={language}
                  className="max-w-full truncate rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100"
                >
                  {language}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Not set yet</p>
          )}
        </GlassCard>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Speaks"
        variant="form"
        className="!p-0 !max-h-[min(88dvh,640px)]"
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-1">
            <p className="mb-4 text-sm text-neutral-500">Type to search, then tap a suggestion to add it.</p>

            {selected.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {selected.map((language) => (
                  <span
                    key={language}
                    className="inline-flex max-w-full items-center gap-1 rounded-full bg-emerald-600 py-1.5 pl-3 pr-1.5 text-xs font-semibold text-white"
                  >
                    <span className="truncate">{language}</span>
                    <button
                      type="button"
                      onClick={() => setSelected((prev) => removeLanguage(prev, language))}
                      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm leading-none"
                      aria-label={`Remove ${language}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Search languages
            </label>
            <input
              className="ios-input w-full min-w-0 text-[15px]"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="e.g. English, Arabic, Bengali"
              disabled={saving}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              onKeyDown={handleSearchKeyDown}
            />

            {(suggestions.length > 0 || canAddCustom) && (
              <ul className="mt-3 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                {suggestions.map((language) => (
                  <li key={language} className="border-b border-neutral-100 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => pickLanguage(language)}
                      disabled={saving}
                      className="flex w-full items-center px-4 py-3 text-left text-[15px] font-medium text-neutral-900 transition-colors hover:bg-emerald-50 active:bg-emerald-100/80"
                    >
                      {language}
                    </button>
                  </li>
                ))}
                {canAddCustom && (
                  <li className="border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => pickLanguage(search.trim())}
                      disabled={saving}
                      className="flex w-full items-center px-4 py-3 text-left text-[15px] font-medium text-emerald-700 transition-colors hover:bg-emerald-50 active:bg-emerald-100/80"
                    >
                      Add “{search.trim()}”
                    </button>
                  </li>
                )}
              </ul>
            )}

            {!query && suggestions.length === 0 && selected.length > 0 && (
              <p className="mt-3 text-sm text-neutral-500">All suggested languages are already added.</p>
            )}
          </div>

          <div className="shrink-0 space-y-2 border-t border-neutral-100 px-5 pb-[calc(var(--safe-bottom)+16px)] pt-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <AppButton type="button" disabled={saving} fullWidth onClick={() => void saveLanguages()}>
              {saving ? 'Saving…' : 'Save'}
            </AppButton>
          </div>
        </div>
      </Dialog>
    </>
  );
};
