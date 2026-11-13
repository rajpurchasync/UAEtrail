import { X } from 'lucide-react';
import { useComposeRail } from '../../context/ComposeRailContext';

/** Right compose / preview panel — only takes space when open (pushes main column left). */
export const ComposeRail = () => {
  const { isOpen, title, content, closeRail } = useComposeRail();

  return (
    <aside
      aria-hidden={!isOpen}
      {...(isOpen ? {} : { inert: true })}
      className={`hidden md:flex flex-col bg-white border-l border-gray-100 overflow-hidden transition-[width] duration-300 ease-out dark:border-neutral-800 dark:bg-neutral-950 ${
        isOpen
          ? 'w-[min(28rem,42vw)] shrink-0'
          : 'w-0 min-w-0 shrink border-transparent pointer-events-none'
      }`}
    >
      <div
        className={`flex h-full flex-col transition-opacity duration-200 ${
          isOpen ? 'min-w-[min(28rem,42vw)] opacity-100' : 'min-w-0 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
          <h2 className="text-sm font-semibold text-gray-900 truncate">{title ?? 'Preview'}</h2>
          <button
            type="button"
            onClick={closeRail}
            className="shrink-0 h-9 w-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            aria-label="Close preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto scroll-touch">{content}</div>
      </div>
    </aside>
  );
};
