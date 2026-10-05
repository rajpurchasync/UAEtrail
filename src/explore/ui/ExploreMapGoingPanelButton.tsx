import { SecureAvatar } from '../../components/ui';
import {
  EXPLORE_GOING_MAP_BUTTON_LABEL,
  exploreGoingMapButtonAriaLabel,
} from '../../content/exploreGoingPanelCopy';
import { EXPLORE_MAP_TOOLBAR_FLOATING, EXPLORE_MAP_TOOLBAR_PILL_PADDING } from '../../config/exploreTheme';

type Preview = { id: string; name: string; avatar?: string | null };

type ExploreMapGoingPanelButtonProps = {
  avatars: Preview[];
  extraCount: number;
  totalJoining: number;
  onClick: () => void;
  className?: string;
};

const PLACEHOLDER_SLOTS = 3;

export const ExploreMapGoingPanelButton = ({
  avatars,
  extraCount,
  totalJoining,
  onClick,
  className = '',
}: ExploreMapGoingPanelButtonProps) => {
  const hasLivePeople = avatars.length > 0;
  const ariaLabel = exploreGoingMapButtonAriaLabel(totalJoining);

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
            {extraCount > 0 ? (
              <span className="ml-1 text-xs font-bold text-gray-600">+{extraCount}</span>
            ) : null}
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
      <span className="whitespace-nowrap">{EXPLORE_GOING_MAP_BUTTON_LABEL}</span>
    </button>
  );
};
