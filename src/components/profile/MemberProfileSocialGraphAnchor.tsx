import type { ReactNode } from 'react';
import { MemberProfileDeferredSectionAnchor } from './MemberProfileDeferredSectionAnchor';

/** Fire once when the social block nears the viewport — defers `GET …/social-graph`. */
export const MemberProfileSocialGraphAnchor = (props: {
  onVisible: () => void;
  active: boolean;
  minHeightClass?: string;
  children?: ReactNode;
}) => (
  <MemberProfileDeferredSectionAnchor {...props} minHeightClass={props.minHeightClass ?? 'min-h-[6rem]'} />
);
