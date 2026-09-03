import { ActivityListing } from '../../types';
import { JoinRequestModal } from './JoinRequestModal';

interface BookingModalProps {
  activity?: ActivityListing;
  /** @deprecated Use activity */
  trip?: ActivityListing;
  onClose: () => void;
}

/** @deprecated Use JoinRequestModal directly — kept for CampDetail activity cards */
export const BookingModal = ({ activity, trip, onClose }: BookingModalProps) => {
  const item = activity ?? trip!;
  return <JoinRequestModal open activity={item} trip={item} onClose={onClose} isFull={item.slotsAvailable <= 0} />;
};
