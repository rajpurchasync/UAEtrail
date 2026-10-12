import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MemberGoalActivityFilter, MemberMapPinActivityType } from '@uaetrail/shared-types';
import { ConsumerBottomSheet } from '../mobile/ConsumerBottomSheet';
import { JourneyMapActivityTypePicker } from '../journey/JourneyMapActivityTypePicker';
import { createMemberMapPin } from '../../hooks/memberJourneyMapApi';
import { PERSONAL_MAP_LOG_DEFAULT } from '../../config/personalMapDefaults';
import { tripsMapPath } from '../../member-plan/tripsRouting';
import { defaultPinTypeForGoalFilter } from '../../utils/goalActivityAlignment';
import { todayIsoDateLocal } from './goalCopy';

type LogOutdoorOutingSheetProps = {
  open: boolean;
  onClose: () => void;
  goalFilter?: MemberGoalActivityFilter | null;
  onLogged?: () => void;
};

export const LogOutdoorOutingSheet = ({
  open,
  onClose,
  goalFilter,
  onLogged,
}: LogOutdoorOutingSheetProps) => {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [placeDate, setPlaceDate] = useState(todayIsoDateLocal());
  const [activityType, setActivityType] = useState<MemberMapPinActivityType>('hike');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setPlaceDate(todayIsoDateLocal());
    setActivityType(defaultPinTypeForGoalFilter(goalFilter ?? 'all_outings'));
    setError(null);
  }, [open, goalFilter]);

  const submit = async () => {
    const venue = title.trim() || 'Outdoor outing';
    setSaving(true);
    setError(null);
    try {
      await createMemberMapPin({
        kind: 'visited',
        latitude: PERSONAL_MAP_LOG_DEFAULT.latitude,
        longitude: PERSONAL_MAP_LOG_DEFAULT.longitude,
        title: venue,
        placeDate,
        activityType,
      });
      onLogged?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this outing.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ConsumerBottomSheet
      open={open}
      onClose={onClose}
      zIndex={1450}
      headerTone="warm"
      title="Log an outing"
      subtitle="Adds a visited pin on My Map and counts toward your joining goal."
    >
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-neutral-800">Where</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Venue or trail name"
            className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-3 text-base text-neutral-900"
            maxLength={200}
            autoComplete="off"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-neutral-800">Date</span>
          <input
            type="date"
            value={placeDate}
            onChange={(e) => setPlaceDate(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-3 text-base text-neutral-900"
          />
        </label>

        <div>
          <p className="text-sm font-medium text-neutral-800 mb-2">Type</p>
          <JourneyMapActivityTypePicker value={activityType} onChange={setActivityType} disabled={saving} />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="button"
          disabled={saving}
          onClick={() => void submit()}
          className="w-full min-h-[48px] rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save to My Map'}
        </button>

        <p className="text-center text-xs text-neutral-500 leading-relaxed">
          Same list as wishlist vs visited on{' '}
          <Link to={tripsMapPath()} className="font-semibold text-emerald-700" onClick={onClose}>
            My Map
          </Link>
          . Drop the pin on the map later to set an exact location.
        </p>
      </div>
    </ConsumerBottomSheet>
  );
};
