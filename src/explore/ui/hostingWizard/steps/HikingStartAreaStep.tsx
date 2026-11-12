import { useState } from 'react';
import { EXPLORE_BRAND_ACTIVE } from '../../../../config/exploreTheme';
import { ComposeMapEntryRow, formatComposeMapCoord } from '../../../create/interactions';
import { reverseCommunityCity } from '../../../../lib/placeSearch';
import {
  HOME_START_AREA_NOTE,
  HOME_START_HINT,
  HOME_START_PIN_CTA,
  HOME_START_PIN_OFFER,
  HOME_START_UNMATCHED,
  HOME_START_USE_LOCATION,
} from '../../../createFlowCopy';
import type { CreateActivityDraft } from '../../hostingFlowEngine';

type HikingStartAreaStepProps = {
  draft: CreateActivityDraft;
  patchDraft: (patch: Partial<CreateActivityDraft>) => void;
  onPin: () => void;
};

/** Community and city for where the member starts. The consented coordinates stay on the draft. */
export const HikingStartAreaStep = ({ draft, patchDraft, onPin }: HikingStartAreaStepProps) => {
  const [busy, setBusy] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const named = Boolean(draft.fromLabel.trim()) && draft.latitude != null && draft.longitude != null;

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Location is not available on this device. Pin the area you start from.');
      return;
    }
    setBusy(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        void reverseCommunityCity(latitude, longitude).then((place) => {
          setBusy(false);
          if (!place) {
            setLocError(HOME_START_UNMATCHED);
            return;
          }
          patchDraft({
            latitude,
            longitude,
            fromLabel: place.label,
            fromLocationPrecise: false,
            goingFromNotes: '',
          });
        });
      },
      () => {
        setBusy(false);
        setLocError('Could not read your location. Pin the area you start from.');
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 120_000 }
    );
  };

  return (
    <>
      <p className="mb-4 text-sm leading-relaxed text-neutral-600">{HOME_START_HINT}</p>
      <button
        type="button"
        disabled={busy}
        onClick={useMyLocation}
        className={`mb-4 w-full rounded-full px-4 py-3 text-sm font-bold disabled:opacity-60 ${EXPLORE_BRAND_ACTIVE}`}
      >
        {busy ? 'Finding your area…' : HOME_START_USE_LOCATION}
      </button>

      {named ? (
        <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-950">
          <span className="font-bold">{draft.fromLabel}</span>
          <span className="mt-0.5 block text-xs text-emerald-900/80">{HOME_START_AREA_NOTE}</span>
        </p>
      ) : null}

      <div className="mt-1">
        <p className="mb-2 text-sm text-neutral-600">{HOME_START_PIN_OFFER}</p>
        <ComposeMapEntryRow
          title={HOME_START_PIN_CTA}
          subtitle={formatComposeMapCoord(draft.latitude, draft.longitude, named)}
          placed={named}
          onOpen={onPin}
        />
      </div>

      {locError ? <p className="mt-3 text-sm text-red-700">{locError}</p> : null}
    </>
  );
};
