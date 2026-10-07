import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import type { MemberMapPinActivityType, MemberMapPinDTO, JourneyMapEntryDTO } from '@uaetrail/shared-types';
import { ConsumerBottomSheet } from '../mobile/ConsumerBottomSheet';
import { JourneyMapActivityTypePicker } from './JourneyMapActivityTypePicker';
import { normalizeJourneyMapActivityType, journeyMapActivityLabel } from '../../trips/journeyMapActivityTypes';
import { journeyEntryCategoryBadge } from '../../trips/journeyMapCategoryBadge';

export type NewPinSheet = { type: 'new'; lat: number; lng: number };
export type ViewPinSheet = { type: 'view'; pin: MemberMapPinDTO };
export type ViewEntrySheet = { type: 'view-entry'; entry: JourneyMapEntryDTO };

export type JourneyMapSheetState = NewPinSheet | ViewPinSheet | ViewEntrySheet;

interface JourneyMapPinSheetProps {
  sheet: JourneyMapSheetState;
  saving: boolean;
  onClose: () => void;
  onCreate: (input: {
    kind: 'wishlist' | 'visited';
    activityType: MemberMapPinActivityType;
    title?: string;
    placeDate?: string;
  }) => void;
  onUpdate: (
    pinId: string,
    input: {
      title: string;
      placeDate: string;
      kind: 'wishlist' | 'visited';
      activityType: MemberMapPinActivityType;
      notes: string | null;
    }
  ) => void;
  onDelete: (pinId: string) => void;
}

const formatPlaceDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export const JourneyMapPinSheet = ({
  sheet,
  saving,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: JourneyMapPinSheetProps) => {
  const [activityType, setActivityType] = useState<MemberMapPinActivityType>('hike');
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [placeDate, setPlaceDate] = useState(todayIso());
  const [kind, setKind] = useState<'wishlist' | 'visited'>('visited');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (sheet.type === 'view') {
      const p = sheet.pin;
      setActivityType(normalizeJourneyMapActivityType(p.activityType));
      setTitle(p.title);
      setPlaceDate(p.placeDate);
      setKind(p.kind);
      setNotes(p.notes ?? '');
      setEditing(false);
    } else {
      setActivityType('hike');
      setTitle('');
      setPlaceDate(todayIso());
      setKind('visited');
      setNotes('');
      setEditing(false);
    }
  }, [sheet]);

  const shell = (title: string, subtitle: string | undefined, children: ReactNode) => (
    <ConsumerBottomSheet open title={title} subtitle={subtitle} onClose={onClose} zIndex={2000}>
      {children}
    </ConsumerBottomSheet>
  );

  if (sheet.type === 'new') {
    return shell('Save this spot', 'Tap Gone or Want to go', (
      <>
        <JourneyMapActivityTypePicker value={activityType} onChange={setActivityType} disabled={saving} />
        <label className="mt-4 block">
          <span className="text-sm font-medium text-neutral-800">Name (optional)</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Wadi Shab, Dolomites trek"
            className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-3 text-base text-neutral-900"
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-sm font-medium text-neutral-800">Date</span>
          <input
            type="date"
            value={placeDate}
            onChange={(e) => setPlaceDate(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-3 text-base text-neutral-900"
          />
        </label>
        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              onCreate({
                kind: 'visited',
                activityType,
                title: title.trim() || undefined,
                placeDate,
              })
            }
            className="min-h-12 w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-base font-semibold text-white disabled:opacity-60"
          >
            Gone
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              onCreate({
                kind: 'wishlist',
                activityType,
                title: title.trim() || undefined,
                placeDate,
              })
            }
            className="min-h-12 w-full rounded-2xl bg-amber-500 px-4 py-3.5 text-base font-semibold text-white disabled:opacity-60"
          >
            Want to go
          </button>
          <button type="button" onClick={onClose} className="min-h-11 py-2 text-sm font-medium text-neutral-500">
            Move pin on map
          </button>
        </div>
      </>
    ));
  }

  if (sheet.type === 'view-entry') {
    const entry = sheet.entry;
    const badge = journeyEntryCategoryBadge(entry);
    const subtitle = [
      badge.label,
      formatPlaceDate(entry.placeDate),
      journeyMapActivityLabel(entry.activityType),
    ]
      .filter(Boolean)
      .join(' · ');

    return shell(entry.title, subtitle, (
      <>
        {entry.latitude == null || entry.longitude == null ? (
          <p className="text-sm text-amber-800">This outing has no map coordinates yet.</p>
        ) : null}
        {entry.activityPath ? (
          <Link
            to={entry.activityPath}
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-emerald-50 px-4 text-sm font-semibold text-emerald-800"
            onClick={onClose}
          >
            Open outing
          </Link>
        ) : null}
      </>
    ));
  }

  if (sheet.type !== 'view') return null;

  const pin = sheet.pin;
  const canEdit = pin.source === 'manual';
  const canDelete = pin.source === 'manual';

  if (editing && canEdit) {
    return shell('Edit pin', pin.title, (
      <>
        <JourneyMapActivityTypePicker
          value={activityType}
          onChange={setActivityType}
          disabled={saving}
        />
        <label className="mt-4 block">
          <span className="text-sm font-medium text-neutral-800">Name</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-3 text-base"
            maxLength={200}
          />
        </label>
        <label className="mt-3 block">
          <span className="text-sm font-medium text-neutral-800">Date</span>
          <input
            type="date"
            value={placeDate}
            onChange={(e) => setPlaceDate(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-3 text-base"
          />
        </label>
        <div className="mt-3 flex gap-2">
          {(['visited', 'wishlist'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`min-h-11 flex-1 rounded-xl border text-sm font-semibold ${
                kind === k
                  ? k === 'visited'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-amber-500 bg-amber-50 text-amber-900'
                  : 'border-neutral-200 text-neutral-700'
              }`}
            >
              {k === 'visited' ? 'Gone' : 'Want to go'}
            </button>
          ))}
        </div>
        <label className="mt-3 block">
          <span className="text-sm font-medium text-neutral-800">Note (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1.5 w-full resize-none rounded-xl border border-neutral-200 px-3 py-3 text-base"
            maxLength={2000}
          />
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            onUpdate(pin.id, {
              title: title.trim() || pin.title,
              placeDate,
              kind,
              activityType,
              notes: notes.trim() ? notes.trim() : null,
            })
          }
          className="mt-5 min-h-12 w-full rounded-2xl bg-emerald-600 text-base font-semibold text-white disabled:opacity-60"
        >
          Save
        </button>
        <button type="button" onClick={() => setEditing(false)} className="mt-2 w-full py-2 text-sm text-neutral-500">
          Cancel
        </button>
      </>
    ));
  }

  const pinSubtitle = [
    pin.kind === 'wishlist' ? 'Want to go' : 'Gone',
    journeyMapActivityLabel(pin.activityType),
    pin.source === 'activity_check_in' ? 'UAE Trail' : null,
    formatPlaceDate(pin.placeDate),
  ]
    .filter(Boolean)
    .join(' · ');

  return shell(pin.title, pinSubtitle, (
    <>
      {pin.notes ? <p className="text-sm text-neutral-700">{pin.notes}</p> : null}
      {pin.activityPath ? (
        <Link
          to={pin.activityPath}
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-emerald-50 px-4 text-sm font-semibold text-emerald-800"
          onClick={onClose}
        >
          Open UAE Trail outing
        </Link>
      ) : null}
      <div className="mt-5 flex flex-col gap-2">
        {canEdit ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="min-h-11 w-full rounded-2xl border border-neutral-200 text-sm font-semibold text-neutral-800"
          >
            Edit details
          </button>
        ) : null}
        {canDelete ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => onDelete(pin.id)}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-100 text-sm font-semibold text-red-700"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Remove pin
          </button>
        ) : null}
      </div>
    </>
  ));
};
