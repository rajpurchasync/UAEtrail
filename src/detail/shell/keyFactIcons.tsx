import type { ReactNode } from 'react';
import {
  Banknote,
  Building2,
  Calendar,
  Clock,
  Gauge,
  MapPin,
  Mountain,
  Ruler,
  Star,
  Tent,
  Trees,
  Users,
  Truck,
} from 'lucide-react';

const iconClass = 'h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300';

export type KeyFactIconKind =
  | 'length'
  | 'distance'
  | 'route'
  | 'duration'
  | 'time'
  | 'elevation'
  | 'difficulty'
  | 'spots'
  | 'price'
  | 'date'
  | 'surface'
  | 'camping'
  | 'capacity'
  | 'facility'
  | 'region'
  | 'condition'
  | 'location'
  | 'rating'
  | 'activities'
  | 'places'
  | 'seeking'
  | 'delivery';

export const renderKeyFactIcon = (kind: KeyFactIconKind): ReactNode => {
  switch (kind) {
    case 'length':
    case 'distance':
    case 'route':
      return <Ruler className={iconClass} aria-hidden />;
    case 'duration':
    case 'time':
      return <Clock className={iconClass} aria-hidden />;
    case 'elevation':
      return <Mountain className={iconClass} aria-hidden />;
    case 'difficulty':
      return <Gauge className={iconClass} aria-hidden />;
    case 'spots':
    case 'capacity':
      return <Users className={iconClass} aria-hidden />;
    case 'price':
      return <Banknote className={iconClass} aria-hidden />;
    case 'date':
      return <Calendar className={iconClass} aria-hidden />;
    case 'surface':
      return <Trees className={iconClass} aria-hidden />;
    case 'camping':
      return <Tent className={iconClass} aria-hidden />;
    case 'facility':
    case 'condition':
      return <Building2 className={iconClass} aria-hidden />;
    case 'location':
    case 'region':
      return <MapPin className={iconClass} aria-hidden />;
    case 'rating':
      return <Star className={iconClass} aria-hidden />;
    case 'delivery':
      return <Truck className={iconClass} aria-hidden />;
    case 'activities':
    case 'places':
    case 'seeking':
      return <MapPin className={iconClass} aria-hidden />;
    default:
      return <MapPin className={iconClass} aria-hidden />;
  }
};

/** Map consumer-facing fact labels (place peek, shop, area) to icon kinds. */
export const keyFactIconKindFromLabel = (label: string): KeyFactIconKind => {
  switch (label.trim().toLowerCase()) {
    case 'length':
      return 'length';
    case 'route':
      return 'route';
    case 'duration':
      return 'duration';
    case 'elevation':
    case 'elev.':
      return 'elevation';
    case 'difficulty':
      return 'difficulty';
    case 'surface':
      return 'surface';
    case 'camping':
      return 'camping';
    case 'capacity':
      return 'capacity';
    case 'facility':
      return 'facility';
    case 'region':
      return 'region';
    case 'condition':
      return 'condition';
    case 'location':
      return 'location';
    case 'rating':
      return 'rating';
    case 'activities':
      return 'activities';
    case 'places':
      return 'places';
    case 'seeking':
      return 'seeking';
    case 'distance':
      return 'distance';
    case 'spots':
      return 'spots';
    case 'price':
      return 'price';
    case 'date':
      return 'date';
    case 'time':
      return 'time';
    case 'last checked':
      return 'condition';
    case 'delivery':
      return 'delivery';
    default:
      return 'location';
  }
};

export const keyFactIconFromLabel = (label: string): ReactNode =>
  renderKeyFactIcon(keyFactIconKindFromLabel(label));
