/** Section divider — same pattern as {@link ListExplorer} date groups. */
export const BrowseListSectionHeader = ({ label }: { label: string }) => (
  <h2 className="mb-2 flex items-center gap-2.5 text-sm font-semibold text-neutral-800">
    <span className="h-0.5 w-8 shrink-0 rounded-full bg-emerald-600" aria-hidden />
    <span className="shrink-0">{label}</span>
    <span className="h-0.5 min-w-6 flex-1 rounded-full bg-neutral-200" aria-hidden />
  </h2>
);