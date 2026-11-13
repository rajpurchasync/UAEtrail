import { CreateIntentPickerSheet } from '../../create/CreateIntentPickerSheet';
import { PLAN_ADD_MENU_TITLE, PLAN_ADD_OPTIONS, type PlanAddOptionId } from '../../plan/planAdd';

type PlanAddIntentSheetProps = {
  open: boolean;
  onSelect: (id: PlanAddOptionId) => void;
  onClose: () => void;
};

export const PlanAddIntentSheet = ({ open, onSelect, onClose }: PlanAddIntentSheetProps) => (
  <CreateIntentPickerSheet
    open={open}
    title={PLAN_ADD_MENU_TITLE}
    options={PLAN_ADD_OPTIONS}
    onSelect={onSelect}
    onClose={onClose}
  />
);
