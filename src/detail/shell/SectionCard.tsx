import type { ReactNode } from 'react';
import { ConsumerDetailSection } from './ConsumerDetailSection';
import type { ConsumerDetailSectionTone } from './consumerDetailSectionTones';

export const SectionCard = ({
  id,
  title,
  children,
  action,
  bodyClassName = '',
  tone = 'emerald',
  collapsible,
  defaultExpanded,
}: {
  id?: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
  bodyClassName?: string;
  tone?: ConsumerDetailSectionTone;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}) => {
  if (!children) return null;
  return (
    <ConsumerDetailSection
      id={id}
      title={title}
      tone={tone}
      action={action}
      bodyClassName={bodyClassName}
      collapsible={collapsible}
      defaultExpanded={defaultExpanded}
    >
      {children}
    </ConsumerDetailSection>
  );
};
