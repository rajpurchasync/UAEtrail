import { Plus } from 'lucide-react';
import { MOBILE_DOCK_ICON } from '../../config/exploreTheme';
import { BROWSE_LIST_CREATE_TRIP } from '../browseListCopy';
import { LIST_CREATE_FAB, LIST_MAP_FLOAT_POSITION } from '../listChromeTheme';

interface BrowseListCreateFabProps {
  onClick: () => void;
  label?: string;
}

export const BrowseListCreateFab = ({
  onClick,
  label = BROWSE_LIST_CREATE_TRIP,
}: BrowseListCreateFabProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`${LIST_CREATE_FAB} ${LIST_MAP_FLOAT_POSITION}`}
    aria-label={label}
  >
    <Plus className={MOBILE_DOCK_ICON} strokeWidth={2.5} aria-hidden />
    <span className="truncate">{label}</span>
  </button>
);
