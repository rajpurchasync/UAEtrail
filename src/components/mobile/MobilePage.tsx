import { ReactNode } from 'react';
import { ConsumerShell } from './ConsumerShell';

interface MobilePageProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  header?: ReactNode;
  action?: ReactNode;
  flush?: boolean;
}

/** Consumer page shell — delegates to ConsumerShell on mobile. */
export const MobilePage = ({ title, subtitle, children, header, action, flush }: MobilePageProps) => {
  if (!title) {
    return <div className="min-h-screen consumer-bg md:bg-gray-50">{children}</div>;
  }

  return (
    <ConsumerShell
      title={title}
      subtitle={subtitle}
      action={action}
      toolbar={header}
      flush={flush}
    >
      {children}
    </ConsumerShell>
  );
};
