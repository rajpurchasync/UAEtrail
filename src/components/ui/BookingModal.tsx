import { Trip } from '../../types';
import { JoinRequestModal } from './JoinRequestModal';

interface BookingModalProps {
  trip: Trip;
  onClose: () => void;
}

/** @deprecated Use JoinRequestModal directly — kept for CampDetail trip cards */
export const BookingModal = ({ trip, onClose }: BookingModalProps) => (
  <JoinRequestModal open trip={trip} onClose={onClose} isFull={trip.slotsAvailable <= 0} />
);
