interface FormTabBarProps {
  tabs: { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
}

/** Horizontal tab strip for multi-section form steps. */
export const FormTabBar = ({ tabs, activeId, onChange }: FormTabBarProps) => {
  const distributeEvenly = tabs.length <= 4;

  return (
    <div
      className={`flex w-full min-w-0 max-w-full border-b border-gray-200 ${
        distributeEvenly ? '' : 'gap-0 overflow-x-auto scrollbar-none overscroll-x-contain'
      }`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`touch-manipulation border-b-2 -mb-px px-3 py-2.5 text-sm font-medium transition-colors sm:px-4 ${
            distributeEvenly ? 'min-w-0 flex-1 truncate text-center' : 'shrink-0'
          } ${
            activeId === tab.id
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
