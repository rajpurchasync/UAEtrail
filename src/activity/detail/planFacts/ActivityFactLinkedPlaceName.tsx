import { Link } from 'react-router-dom';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { activityDetailPath } from '../../../config/routingCatalog';
import { activityPlaceReturnState } from '../../../explore/mapPeekDetailNavState';
import { activityRegistryPlacePath } from '../../../utils/activityRegistryPlacePath';

type Props = {
  activity: ActivityDetailDTO;
  name: string;
};

/** Trail / camp name in kind facts — links to registry place detail when the activity is tied to a place. */
export const ActivityFactLinkedPlaceName = ({ activity, name }: Props) => {
  const placePath = activityRegistryPlacePath(activity);
  if (!placePath) {
    return <span>{name}</span>;
  }

  return (
    <Link
      to={placePath}
      state={activityPlaceReturnState(activityDetailPath(activity.id))}
      className="font-semibold text-emerald-800 underline decoration-emerald-300/90 underline-offset-2 hover:text-emerald-950"
    >
      {name}
    </Link>
  );
};
