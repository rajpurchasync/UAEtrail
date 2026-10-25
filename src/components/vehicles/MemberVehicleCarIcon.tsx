import { Car } from 'lucide-react';
import type { MemberVehicleColor } from '@uaetrail/shared-types';
import { memberVehicleColorTileClass } from './memberVehicleColorChrome';

export const MemberVehicleCarIcon = ({
  color,
  className = '',
  size = 'md',
}: {
  color: MemberVehicleColor;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const box =
    size === 'sm' ? 'h-10 w-10' : size === 'lg' ? 'h-14 w-14' : 'h-12 w-12';
  const icon = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-7 w-7' : 'h-6 w-6';

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl shadow-inner ${box} ${memberVehicleColorTileClass(color)} ${className}`}
      aria-hidden
    >
      <Car className={icon} strokeWidth={2.25} />
    </span>
  );
};
