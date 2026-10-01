import {
  GROUP_WALL_REACTION_EMOJI,
  GROUP_WALL_REACTION_KINDS,
  GROUP_WALL_REACTION_LABEL,
  type GroupWallReactionKind,
} from '../../constants/groupReactions';

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
    className={`flex max-w-[240px] flex-wrap gap-1 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg ${className}`}
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
        className={`h-8 w-8 rounded-lg text-base font-emoji hover:bg-neutral-100 ${
          activeKinds.has(kind) ? 'bg-emerald-50' : ''
        }`}
        title={GROUP_WALL_REACTION_LABEL[kind]}
      >
        {GROUP_WALL_REACTION_EMOJI[kind]}
      </button>
    ))}
  </div>
);
