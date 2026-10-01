import { Share2 } from 'lucide-react';

type ActivityHubInviteIconButtonProps = {
  onClick: () => void;
  label?: string;
};

/** Trailing share on Trips hub rows — opens invite sheet (parent owns state). */
export const ActivityHubInviteIconButton = ({
  onClick,
  label = 'Invite your crew',
}: ActivityHubInviteIconButtonProps) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100"
    aria-label={label}
  >
    <Share2 className="h-4 w-4" aria-hidden />
  </button>
);
