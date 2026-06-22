import { useParams } from 'react-router-dom';
import { OrganizerPublicProfile } from '../components/organizer/OrganizerPublicProfile';

/** Public-facing organizer page — about, certificates, trips, reviews. */
export const OperatorProfile = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;

  return (
    <OrganizerPublicProfile slug={id} mode="public" backTo="/trips" backLabel="Back to trips" />
  );
};
