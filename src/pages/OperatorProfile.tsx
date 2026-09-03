import { useParams } from 'react-router-dom';
import { HostPublicProfile } from '../components/host/HostPublicProfile';

/** Public-facing organizer page — about, certificates, trips, reviews. */
export const OperatorProfile = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;

  return (
    <HostPublicProfile slug={id} mode="public" backTo="/activities" backLabel="Back to activities" />
  );
};
