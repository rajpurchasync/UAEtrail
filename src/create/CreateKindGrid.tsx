import { EXPLORE_COMPOSE, EXPLORE_FLOW } from '../config/exploreTheme';
import { exploreFlowKindTileClass } from '../explore/ui/exploreFlowUi';

export type CreateKindOption<Id extends string = string> = {
  id: Id;
  label: string;
  emoji: string;
};

type CreateKindGridProps<Id extends string> = {
  options: ReadonlyArray<CreateKindOption<Id>>;
  onSelect: (id: Id) => void;
};

/** Shared FAB kind tiles — emoji + label only, no hint copy. */
export const CreateKindGrid = <Id extends string>({
  options,
  onSelect,
}: CreateKindGridProps<Id>) => (
  <div className={`${EXPLORE_COMPOSE.pickerChoiceGrid} px-5`}>
    {options.map((option) => (
      <button
        key={option.id}
        type="button"
        onClick={() => onSelect(option.id)}
        className={exploreFlowKindTileClass(false)}
      >
        <span className="text-3xl leading-none font-emoji" aria-hidden>
          {option.emoji}
        </span>
        <p className={EXPLORE_FLOW.choiceCardTitle}>{option.label}</p>
      </button>
    ))}
  </div>
);
