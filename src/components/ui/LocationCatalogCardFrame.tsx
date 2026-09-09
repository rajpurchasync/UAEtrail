import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LocationCardActions, type LocationCardAccent } from './LocationCardActions';

export interface LocationCardActionsConfig {
  detailPath: string;
  reviewPath: string;
  accent?: LocationCardAccent;
}

interface LocationCatalogCardFrameProps {
  href?: string;
  children: ReactNode;
  actions?: LocationCardActionsConfig;
}

/** Single glass card shell for trail / camp / event catalog cards. */
export const LocationCatalogCardFrame = ({ href, children, actions }: LocationCatalogCardFrameProps) => {
  const className =
    'group glass-card-interactive overflow-hidden hover:shadow-glass-lg block w-full max-w-full';

  const content = (
    <>
      {children}
      {actions ? <LocationCardActions {...actions} /> : null}
    </>
  );

  if (href) {
    return (
      <Link to={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
};
