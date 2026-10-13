import { SecureAvatar } from '../../components/ui';
import {
  EXPLORE_PEOPLE_BROWSE_MAP_BUTTON_LABEL,
  explorePeopleBrowseMapButtonAriaLabel,
} from '../../content/explorePeopleBrowseCopy';
import { EXPLORE_MAP_TOOLBAR_FLOATING, EXPLORE_MAP_TOOLBAR_PILL_PADDING } from '../../config/exploreTheme';

type Preview = { id: string; name: string; avatar?: string | null };

type ExploreMapPeopleBrowseButtonProps = {
  avatars: Preview[];
  friendCount: number;
  onClick: () => void;
  className?: string;
};

const PLACEHOLDER_SLOTS = 3;

export const ExploreMapPeopleBrowseButton = ({
  avatars,
  friendCount,
  onClick,
  className = '',
}: ExploreMapPeopleBrowseButtonProps) => {
  const hasLivePeople = avatars.length > 0;
  const ariaLabel = explorePeopleBrowseMapButtonAriaLabel(friendCount);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${EXPLORE_MAP_TOOLBAR_FLOATING} ${EXPLORE_MAP_TOOLBAR_PILL_PADDING} inline-flex shrink-0 items-center gap-2 pl-2 pr-3.5 text-sm font-semibold text-gray-900 ${className}`}
    >
      <span className="flex items-center pl-0.5">
        {hasLivePeople ? (
          <>
            <span className="flex -space-x-2">
              {avatars.map((person) => (
                <SecureAvatar
                  key={person.id}
                  src={person.avatar}
                  name={person.name}
                  className="h-7 w-7 ring-2 ring-white"
                />
              ))}
            </span>
          </>
        ) : (
          <span className="flex -space-x-2" aria-hidden>
            {Array.from({ length: PLACEHOLDER_SLOTS }, (_, index) => (
              <span
                key={index}
                className="inline-block h-7 w-7 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 ring-2 ring-white"
              />
            ))}
          </span>
        )}
      </span>
      <span className="whitespace-nowrap">{EXPLORE_PEOPLE_BROWSE_MAP_BUTTON_LABEL}</span>
    </button>
  );
};
