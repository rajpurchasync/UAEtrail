import {
  GROUP_WALL_REACTION_EMOJI,
  GROUP_WALL_REACTION_KINDS,
  GROUP_WALL_REACTION_LABEL,
  type GroupWallReactionKind,
} from '../../constants/groupReactions';

const PICKER_WIDTH_PX = 288;

export const GROUP_WALL_REACTION_PICKER_WIDTH = PICKER_WIDTH_PX;

type GroupWallReactionPickerProps = {
  activeKinds: Set<GroupWallReactionKind>;
  disabled?: boolean;
  onPick: (kind: GroupWallReactionKind) => void;
  className?: string;
};

export const GroupWallReactionPicker = ({
  activeKinds,
  disabled,
  onPick,
  className = '',
}: GroupWallReactionPickerProps) => (
  <div
    className={`grid w-[288px] max-w-[calc(100vw-1.5rem)] grid-cols-4 gap-2 rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl ${className}`}
    role="toolbar"
    aria-label="Reactions"
    onPointerDown={(event) => event.stopPropagation()}
  >
    {GROUP_WALL_REACTION_KINDS.map((kind) => (
      <button
        key={kind}
        type="button"
        disabled={disabled}
        onClick={() => onPick(kind)}
        className={`flex h-11 w-full items-center justify-center rounded-xl text-2xl font-emoji transition-colors hover:bg-neutral-100 active:bg-neutral-200 ${
          activeKinds.has(kind) ? 'bg-emerald-50 ring-1 ring-emerald-200' : ''
        }`}
        title={GROUP_WALL_REACTION_LABEL[kind]}
        aria-label={GROUP_WALL_REACTION_LABEL[kind]}
      >
        {GROUP_WALL_REACTION_EMOJI[kind]}
      </button>
    ))}
  </div>
);
