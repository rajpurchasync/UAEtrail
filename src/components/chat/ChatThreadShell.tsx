import type { ReactNode, Ref } from 'react';

type ChatThreadScrollVariant = 'direct' | 'group';

const SCROLL_AREA_CLASS: Record<ChatThreadScrollVariant, string> = {
  direct:
    'chat-thread-scroll min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-neutral-50 px-3 py-3 sm:px-6',
  group:
    'chat-thread-scroll min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-neutral-50 px-3 py-3 sm:px-6',
};

type ChatThreadShellProps = {
  className?: string;
  header: ReactNode;
  error?: string | null;
  scrollContainerRef: Ref<HTMLDivElement>;
  scrollVariant?: ChatThreadScrollVariant;
  children: ReactNode;
  footer: ReactNode;
};

/** Shared column layout for direct and group wall threads. */
export const ChatThreadShell = ({
  className = 'chat-thread flex h-full min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden bg-white',
  header,
  error,
  scrollContainerRef,
  scrollVariant = 'group',
  children,
  footer,
}: ChatThreadShellProps) => (
  <div className={className}>
    {header}

    {error ? (
      <p className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">
        {error}
      </p>
    ) : null}

    <div ref={scrollContainerRef} className={SCROLL_AREA_CLASS[scrollVariant]}>
      {children}
    </div>

    {footer}
  </div>
);
