import type { ReactNode } from 'react';
import { ConsumerDetailSection } from './ConsumerDetailSection';
import type { ConsumerDetailSectionTone } from './consumerDetailSectionTones';

/** Plan-column block as a consumer scroll section (matches About / Where). */
export const ConsumerPlanSection = ({
  id,
  title,
  tone = 'slate',
  panelClassName = '',
  children,
}: {
  id: string;
  title: string;
  tone?: ConsumerDetailSectionTone;
  panelClassName?: string;
  children: ReactNode;
}) => (
  <ConsumerDetailSection id={id} title={title} tone={tone} ariaLabel={title} className={panelClassName}>
    {children}
  </ConsumerDetailSection>
);
