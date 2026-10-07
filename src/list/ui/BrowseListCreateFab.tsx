import { Plus } from 'lucide-react';
import { LIST_CREATE_FAB, LIST_MAP_FLOAT_POSITION } from '../listChromeTheme';

interface BrowseListCreateFabProps {
  onClick: () => void;
  label?: string;
}

export const BrowseListCreateFab = ({ onClick, label = 'Add New' }: BrowseListCreateFabProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`${LIST_CREATE_FAB} ${LIST_MAP_FLOAT_POSITION}`}
    aria-label={label}
  >
    <Plus className="h-6 w-6 shrink-0" strokeWidth={2.5} aria-hidden />
  </button>
);
