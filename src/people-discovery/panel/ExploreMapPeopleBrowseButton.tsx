import { SecureAvatar } from '../../components/ui';
import {
  EXPLORE_PEOPLE_BROWSE_MAP_BUTTON_LABEL,
  explorePeopleBrowseGuestMapButtonAriaLabel,
  explorePeopleBrowseMapButtonAriaLabel,
} from '../../content/explorePeopleBrowseCopy';
import { EXPLORE_MAP_FROST_TRAY } from '../../config/exploreTheme';

type Preview = { id: string; name: string; avatar?: string | null };

type ExploreMapPeopleBrowseButtonProps = {
  avatars: Preview[];
  friendCount: number;
  /** Guests see a count of people on map outings — not member faces. */
  guest?: boolean;
  possibleCrewCount?: number;
  onClick: () => void;
  className?: string;
};

const FACE_SLOTS = 2;

export const ExploreMapPeopleBrowseButton = ({
  avatars,
  friendCount,
  guest = false,
  possibleCrewCount = 0,
  onClick,
  className = '',
}: ExploreMapPeopleBrowseButtonProps) => {
  const faces = avatars.slice(0, FACE_SLOTS);
  const overflow = Math.max(avatars.length, friendCount) - faces.length;
  const hasLivePeople = !guest && faces.length > 0;
  const ariaLabel = guest
    ? explorePeopleBrowseGuestMapButtonAriaLabel(possibleCrewCount)
    : explorePeopleBrowseMapButtonAriaLabel(friendCount);
  const crewBadge =
    possibleCrewCount > 99 ? '99+' : String(Math.max(0, possibleCrewCount));

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${EXPLORE_MAP_FROST_TRAY} inline-flex h-9 w-full min-w-0 items-center justify-center gap-1 overflow-hidden rounded-full !py-0 pl-0.5 pr-2 text-[12px] font-semibold leading-none text-neutral-900 ${className}`}
    >
      <span className="flex shrink-0 items-center" aria-hidden>
        {guest ? (
          <span className="find-crew-avatar flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-bold leading-none text-white ring-2 ring-white/80">
            {crewBadge}
          </span>
        ) : hasLivePeople ? (
          <>
            <span className="flex shrink-0 items-center -space-x-1.5">
              {faces.map((person) => (
                <SecureAvatar
                  key={person.id}
                  src={person.avatar}
                  name={person.name}
                  className="find-crew-avatar h-7 w-7 shrink-0 ring-2 ring-white/80"
                />
              ))}
            </span>
            {overflow > 0 ? (
              <span className="find-crew-avatar -ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold leading-none text-white ring-2 ring-white/80">
                +{overflow > 99 ? '99' : overflow}
              </span>
            ) : null}
          </>
        ) : (
          <span className="flex shrink-0 items-center -space-x-1.5">
            {Array.from({ length: FACE_SLOTS }, (_, index) => (
              <span
                key={index}
                className="find-crew-avatar inline-block h-7 w-7 shrink-0 rounded-full border border-dashed border-neutral-400/80 bg-white/35 ring-2 ring-white/80"
              />
            ))}
          </span>
        )}
      </span>
      <span className="min-w-0 truncate">{EXPLORE_PEOPLE_BROWSE_MAP_BUTTON_LABEL}</span>
    </button>
  );
};
