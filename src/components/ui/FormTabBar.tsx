interface FormTabBarProps {
  tabs: { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
}

/** Horizontal tab strip for multi-section form steps. */
export const FormTabBar = ({ tabs, activeId, onChange }: FormTabBarProps) => (
  <div className="flex border-b border-gray-200 gap-0 overflow-x-auto">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        onClick={() => onChange(tab.id)}
        className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px touch-manipulation transition-colors ${
          activeId === tab.id
            ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
