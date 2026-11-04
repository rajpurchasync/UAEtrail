import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

type ChatThreadHeaderBarProps = {
  onBack: () => void;
  backLabel: string;
  /** Show back below lg only — desktop split pane keeps the inbox visible. */
  backVisibility?: 'always' | 'mobile-only';
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  /** Wrap title block in a button (group info tap). */
  titleButton?: { onClick: () => void };
};

export const ChatThreadHeaderBar = ({
  onBack,
  backLabel,
  backVisibility = 'always',
  leading,
  title,
  subtitle,
  trailing,
  titleButton,
}: ChatThreadHeaderBarProps) => {
  const backClass =
    backVisibility === 'mobile-only'
      ? 'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 lg:hidden'
      : 'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 lg:min-h-8 lg:min-w-8';

  const titleBlock = (
    <>
      {leading}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-gray-900">{title}</div>
        {subtitle ? <div className="text-xs text-gray-500">{subtitle}</div> : null}
      </div>
    </>
  );

  return (
    <div className="chat-thread-header flex shrink-0 items-center gap-2 border-b bg-white p-2 shadow-sm pt-safe-plus-2 md:gap-2 md:px-2 md:py-1.5">
      <button type="button" onClick={onBack} className={backClass} aria-label={backLabel}>
        <ArrowLeft className="h-5 w-5" />
      </button>

      {titleButton ? (
        <button
          type="button"
          onClick={titleButton.onClick}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left hover:bg-neutral-50 pr-1"
        >
          {titleBlock}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{titleBlock}</div>
      )}

      {trailing}
    </div>
  );
};
