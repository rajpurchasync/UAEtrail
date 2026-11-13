import { EXPLORE_Z } from '../config/exploreTheme';
import { ExploreResponsiveSheet } from '../explore/ui/ExploreResponsiveSheet';
import { FlowSheetHeader } from '../explore/ui/ExploreFlowSheetChrome';
import { CreateKindGrid, type CreateKindOption } from './CreateKindGrid';

type CreateIntentPickerSheetProps<Id extends string> = {
  open: boolean;
  title: string;
  options: ReadonlyArray<CreateKindOption<Id>>;
  onSelect: (id: Id) => void;
  onClose: () => void;
};

/** Centered kind picker used by Explore and Plan FABs. */
export const CreateIntentPickerSheet = <Id extends string>({
  open,
  title,
  options,
  onSelect,
  onClose,
}: CreateIntentPickerSheetProps<Id>) => {
  if (!open) return null;

  return (
    <ExploreResponsiveSheet
      open
      onClose={onClose}
      title={title}
      maxWidthClass="lg:max-w-md"
      zClass={EXPLORE_Z.composeFlow}
      overlayFixed
      composePresentation="menu"
      viewportAdaptive
      showHandle={false}
      showCloseButton
      panelClassName="overflow-hidden px-0 pb-[calc(var(--safe-bottom)+1rem)] pt-0 lg:pb-8 lg:pt-3"
    >
      <FlowSheetHeader title={title} onClose={onClose} pickerTitle />
      <CreateKindGrid options={options} onSelect={onSelect} />
    </ExploreResponsiveSheet>
  );
};
