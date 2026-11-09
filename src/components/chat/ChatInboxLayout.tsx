import type { ReactNode } from 'react';
import { CHAT_CHROME } from './chatChrome';

type ChatInboxLayoutProps = {
  toolbar: ReactNode;
  children: ReactNode;
};

/** Chat tab inbox — search toolbar + scrolling list (no ConsumerShell tab chrome). */
export const ChatInboxLayout = ({ toolbar, children }: ChatInboxLayoutProps) => (
  <div className={CHAT_CHROME.hubColumn}>
    <div className={CHAT_CHROME.hubToolbarPad}>{toolbar}</div>
    <div className={CHAT_CHROME.hubListScroll}>{children}</div>
  </div>
);
