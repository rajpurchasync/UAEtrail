import { Pencil, Plus } from 'lucide-react';
import { parseLanguagesList } from '../../utils/profileLanguages';
import { profileFormSectionTitleClass } from './ProfileFormSection';
export type ProfileHubEditFocus = 'bio' | 'languages';

type ProfileHubDetailsCardProps = {
  bio?: string | null;
  languages?: string | null;
  onEditSection: (focus: ProfileHubEditFocus) => void;
};

const EditIconButton = ({
  hasContent,
  ariaLabel,
  onEdit,
}: {
  hasContent: boolean;
  ariaLabel: string;
  onEdit: () => void;
}) => {
  const Icon = hasContent ? Pencil : Plus;
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={ariaLabel}
      className="flex h-8 w-8 shrink-0 items-center justify-center text-neutral-500 active:text-neutral-800"
    >
      <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden />
    </button>
  );
};

/** About and Speaks — separate cards, bold titles only. */
export const ProfileHubDetailsCard = ({
  bio,
  languages,
  onEditSection,
}: ProfileHubDetailsCardProps) => {
  const languageList = parseLanguagesList(languages);
  const bioTrimmed = bio?.trim() ?? '';

  return (
    <>
      <div className="glass-card px-3.5 py-3">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <h2 className={profileFormSectionTitleClass}>About</h2>
          <EditIconButton
            hasContent={Boolean(bioTrimmed)}
            ariaLabel={bioTrimmed ? 'Edit bio' : 'Add bio'}
            onEdit={() => onEditSection('bio')}
          />
        </div>
        {bioTrimmed ? (
          <p className="text-[15px] font-normal leading-relaxed text-neutral-700 whitespace-pre-line">
            {bioTrimmed}
          </p>
        ) : (
          <p className="text-[15px] text-neutral-300" aria-hidden>
            —
          </p>
        )}
      </div>

      <div className="glass-card px-3.5 py-3">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <h2 className={profileFormSectionTitleClass}>Speaks</h2>
          <EditIconButton
            hasContent={languageList.length > 0}
            ariaLabel={languageList.length > 0 ? 'Edit languages' : 'Add languages'}
            onEdit={() => onEditSection('languages')}
          />
        </div>
        {languageList.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {languageList.map((language) => (
              <span
                key={language}
                className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100"
              >
                {language}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[15px] text-neutral-300" aria-hidden>
            —
          </p>
        )}
      </div>
    </>
  );
};
