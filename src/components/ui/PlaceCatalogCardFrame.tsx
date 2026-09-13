import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PlaceCardActions, type PlaceCardAccent } from './PlaceCardActions';

export interface PlaceCardActionsConfig {
  detailPath: string;
  reviewPath: string;
  accent?: PlaceCardAccent;
}

interface PlaceCatalogCardFrameProps {
  href?: string;
  children: ReactNode;
  actions?: PlaceCardActionsConfig;
}

/** Single glass card shell for trail / camp / event catalog cards. */
export const PlaceCatalogCardFrame = ({ href, children, actions }: PlaceCatalogCardFrameProps) => {
  const className =
    'group glass-card-interactive overflow-hidden hover:shadow-glass-lg block w-full max-w-full';

  const content = (
    <>
      {children}
      {actions ? <PlaceCardActions {...actions} /> : null}
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

/** @deprecated Use PlaceCardActionsConfig */
export type LocationCardActionsConfig = PlaceCardActionsConfig;
/** @deprecated Use PlaceCatalogCardFrame */
export const LocationCatalogCardFrame = PlaceCatalogCardFrame;
