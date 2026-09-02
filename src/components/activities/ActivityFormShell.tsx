import type { ReactNode } from 'react';
import { X } from 'lucide-react';

/** Plain white modal for activity creation/edit forms — not the type picker. */
export const ActivityFormShell = ({
  title,
  onClose,
  wide,
  children,
  footer,
  progress,
  stickyTabs,
}: {
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  progress?: ReactNode;
  stickyTabs?: ReactNode;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    onClick={onClose}
    role="presentation"
  >
    <div
      className={`bg-white rounded-lg shadow-xl w-full mx-4 flex flex-col max-h-[90vh] ${
        wide ? 'max-w-2xl' : 'max-w-md'
      }`}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>
      {progress && <div className="px-6 pt-3 pb-4 border-b border-gray-100 shrink-0">{progress}</div>}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {stickyTabs && (
          <div className="shrink-0 px-6 py-2 border-b border-gray-100 bg-white shadow-sm z-10">{stickyTabs}</div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg shrink-0">{footer}</div>
      )}
    </div>
  </div>
);
