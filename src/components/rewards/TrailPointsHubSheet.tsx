import { ReactNode } from 'react';
import { ConsumerBottomSheet } from '../mobile/ConsumerBottomSheet';

interface TrailPointsHubSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Shared bottom sheet for Trail Points hub sections. */
export const TrailPointsHubSheet = ({ open, title, onClose, children }: TrailPointsHubSheetProps) => (
  <ConsumerBottomSheet open={open} title={title} onClose={onClose}>
    {children}
  </ConsumerBottomSheet>
);
