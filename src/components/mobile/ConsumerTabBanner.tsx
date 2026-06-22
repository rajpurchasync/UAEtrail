import { ReactNode } from 'react';

interface ConsumerTabBannerProps {
  title: string;
  action?: ReactNode;
}

/** Slim top strip — page context without dashboard-style chrome. */
export const ConsumerTabBanner = ({ title, action }: ConsumerTabBannerProps) => (
  <div className="consumer-tab-banner">
    <h1 className="consumer-tab-title">{title}</h1>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);
