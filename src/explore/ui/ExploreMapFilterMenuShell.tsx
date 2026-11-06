import type { CSSProperties, ReactNode, Ref } from 'react';

type ExploreMapFilterMenuShellProps = {
  menuRef: Ref<HTMLDivElement>;
  menuStyle: CSSProperties;
  caretLeftPx: number;
  label: string;
  icon: ReactNode;
  children: ReactNode;
  extraListProps?: {
    id?: string;
    role?: 'listbox';
    'aria-label'?: string;
    'aria-multiselectable'?: 'true';
  };
};

/** Portaled filter menu — caret + header tie it to the chip that opened it. */
export const ExploreMapFilterMenuShell = ({
  menuRef,
  menuStyle,
  caretLeftPx,
  label,
  icon,
  children,
  extraListProps,
}: ExploreMapFilterMenuShellProps) => (
  <div
    ref={menuRef}
    style={menuStyle}
    className="relative"
    onMouseDown={(event) => event.stopPropagation()}
    {...extraListProps}
  >
    <span
      aria-hidden
      className="pointer-events-none absolute -top-1.5 z-10 h-3 w-3 rounded-[2px] border-l border-t border-neutral-200/90 bg-white"
      style={{ left: caretLeftPx, transform: 'translateX(-50%) rotate(45deg)' }}
    />
    <div className="max-h-[inherit] overflow-y-auto overflow-x-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_12px_40px_rgba(15,23,42,.18)]">
      <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-700">
          {icon}
        </span>
        <p className="text-[12px] font-semibold text-neutral-600">{label}</p>
      </div>
      <div className="py-1">{children}</div>
    </div>
  </div>
);
