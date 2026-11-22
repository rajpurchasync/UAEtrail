import {
  CREW_PROFESSIONAL_KIND_LABELS,
  CREW_PROFESSIONAL_KIND_ORDER,
  DEFAULT_CREW_PROFESSIONAL_KIND,
  type CrewProfessionalKind,
} from '@/crew-discovery/crewBrowseState';
import { LIST_CHIP_SCROLL, listCategoryPillClass } from '../browse/listChromeTheme';

type CrewsProfessionalKindChipsProps = {
  active: CrewProfessionalKind;
  onSelect: (kind: CrewProfessionalKind) => void;
  onClear?: () => void;
};

export const CrewsProfessionalKindChips = ({
  active,
  onSelect,
  onClear,
}: CrewsProfessionalKindChipsProps) => (
  <div
    className={`${LIST_CHIP_SCROLL} relative z-10 min-w-0 max-w-full snap-x snap-mandatory px-0.5`}
    role="tablist"
    aria-label="Professional filters"
  >
    {CREW_PROFESSIONAL_KIND_ORDER.map((key) => {
      const selected = active === key;
      return (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={selected}
          className={listCategoryPillClass(selected)}
          onClick={(event) => {
            event.preventDefault();
            if (selected && onClear) onClear();
            else onSelect(key);
          }}
        >
          <span className="font-semibold">{CREW_PROFESSIONAL_KIND_LABELS[key]}</span>
        </button>
      );
    })}
  </div>
);

export const crewsProfessionalKindClearTarget = (): CrewProfessionalKind =>
  DEFAULT_CREW_PROFESSIONAL_KIND;