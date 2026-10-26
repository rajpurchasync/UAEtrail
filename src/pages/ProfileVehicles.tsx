import { Link, useNavigate, useParams } from 'react-router-dom';
import { Car, Plus, Trash2 } from 'lucide-react';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { MemberVehicleForm } from '../components/vehicles/MemberVehicleForm';
import { MemberVehicleCarIcon } from '../components/vehicles/MemberVehicleCarIcon';
import { MEMBER_VEHICLE_COLOR_LABELS } from '../components/vehicles/memberVehicleColorChrome';
import { PROFILE_VEHICLES_PATH } from '../config/surfacePaths';
import { useMemberVehicleMutations, useMemberVehicles } from '../hooks/useMemberVehicles';
import { useProfileHubBackChrome, useProfileVehiclesBackChrome } from '../hooks/useProfileHubBackChrome';
import { mobileBackNavState, navigateWithBackChrome } from '../utils/mobileBackNav';
import { formatRideshareVehicleLabel } from '@uaetrail/shared-types';

export const ProfileVehiclesPage = () => {
  const { vehicles, isLoading } = useProfileVehiclesContent();
  const backChrome = useProfileHubBackChrome();

  return (
    <ConsumerShell layout="stack" title="My cars" showJourney={false} back={backChrome}>
      <div className="space-y-4 pb-nav-safe animate-fade-up">
        <p className="text-sm text-neutral-600">
          Cars you use for rideshare. Make, model, color, and year show on the ride listing; the number plate is only visible to you and people on that ride with you.
        </p>
        {isLoading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : vehicles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 p-6 text-center">
            <Car className="mx-auto h-8 w-8 text-neutral-400" aria-hidden />
            <p className="mt-2 text-sm font-semibold text-neutral-900">No cars yet</p>
            <p className="mt-1 text-xs text-neutral-600">Add one before you host a rideshare.</p>
            <Link
              to={`${PROFILE_VEHICLES_PATH}/new`}
              state={mobileBackNavState(PROFILE_VEHICLES_PATH, 'My cars')}
              className="mt-4 inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add car
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-2">
              {vehicles.map((vehicle) => (
                <li
                  key={vehicle.id}
                  className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm"
                >
                  <MemberVehicleCarIcon color={vehicle.color} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-950">
                      {formatRideshareVehicleLabel(vehicle)}
                    </p>
                    <p className="text-xs text-neutral-600">
                      {MEMBER_VEHICLE_COLOR_LABELS[vehicle.color]} · Plate {vehicle.plateNumber}
                    </p>
                  </div>
                  <Link
                    to={`${PROFILE_VEHICLES_PATH}/${vehicle.id}/edit`}
                    state={mobileBackNavState(PROFILE_VEHICLES_PATH, 'My cars')}
                    data-nav-focus={`vehicle-${vehicle.id}`}
                    className="text-xs font-semibold text-emerald-700"
                  >
                    Edit
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to={`${PROFILE_VEHICLES_PATH}/new`}
              state={mobileBackNavState(PROFILE_VEHICLES_PATH, 'My cars')}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-sm font-bold text-emerald-800"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add another car
            </Link>
          </>
        )}
      </div>
    </ConsumerShell>
  );
};

const useProfileVehiclesContent = () => {
  const { data: vehicles = [], isLoading } = useMemberVehicles();
  return { vehicles, isLoading };
};

export const ProfileVehicleEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: vehicles = [] } = useMemberVehicles();
  const { update, remove } = useMemberVehicleMutations();
  const vehicle = vehicles.find((row) => row.id === id) ?? null;
  const backChrome = useProfileVehiclesBackChrome();

  if (!vehicle) {
    return (
      <ConsumerShell layout="stack" title="Edit car" showJourney={false} back={backChrome}>
        <p className="text-sm text-neutral-600">Car not found.</p>
      </ConsumerShell>
    );
  }

  return (
    <ConsumerShell layout="stack" title="Edit car" showJourney={false} back={backChrome}>
      <MemberVehicleForm
        initial={vehicle}
        submitLabel="Save car"
        busy={update.isPending}
        onSubmit={async (input) => {
          await update.mutateAsync({ id: vehicle.id, input });
          navigateWithBackChrome(navigate, backChrome);
        }}
      />
      <button
        type="button"
        disabled={remove.isPending}
        onClick={async () => {
          await remove.mutateAsync(vehicle.id);
          navigateWithBackChrome(navigate, backChrome);
        }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-700"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        Remove car
      </button>
    </ConsumerShell>
  );
};

export const ProfileVehicleNewPage = () => {
  const navigate = useNavigate();
  const { create } = useMemberVehicleMutations();
  const backChrome = useProfileVehiclesBackChrome();

  return (
    <ConsumerShell layout="stack" title="Add car" showJourney={false} back={backChrome}>
      <MemberVehicleForm
        submitLabel="Save car"
        busy={create.isPending}
        onSubmit={async (input) => {
          await create.mutateAsync(input);
          navigateWithBackChrome(navigate, backChrome);
        }}
      />
    </ConsumerShell>
  );
};
