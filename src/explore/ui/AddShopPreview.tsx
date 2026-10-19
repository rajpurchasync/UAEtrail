import { MapPin, Truck } from 'lucide-react';
import type { AddDraft } from './addFlow';
import { formatHostPhonePreview } from '../../components/organisation-console/proProfileApplicationForm';

type AddShopPreviewProps = {
  draft: AddDraft;
};

/** In-wizard preview — aligned with public shop page chrome. */
export const AddShopPreview = ({ draft }: AddShopPreviewProps) => {
  const hero = draft.images[0] ?? null;

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      {hero ? (
        <img src={hero} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 items-center justify-center bg-violet-50 text-sm font-medium text-violet-800">
          Shop image
        </div>
      )}
      <div className="space-y-3 px-4 py-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{draft.title.trim() || 'Shop name'}</h3>
          {draft.locationPinPlaced ? (
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-violet-600" />
              {draft.emirate}
              {draft.latitude != null && draft.longitude != null
                ? ` · ${draft.latitude.toFixed(4)}, ${draft.longitude.toFixed(4)}`
                : ''}
            </p>
          ) : null}
        </div>

        {draft.description.trim() ? (
          <p className="text-sm leading-relaxed text-gray-700">{draft.description.trim()}</p>
        ) : null}

        {draft.shopSearchKeywords.trim() ? (
          <div className="flex flex-wrap gap-1.5">
            {draft.shopSearchKeywords
              .split(/[,;]+/)
              .map((token) => token.trim())
              .filter(Boolean)
              .map((token) => (
                <span
                  key={token}
                  className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-900"
                >
                  {token}
                </span>
              ))}
          </div>
        ) : null}

        {draft.shopDeliveryOffered === true && draft.shopDeliveryRadiusKm != null ? (
          <p className="flex items-center gap-1.5 text-sm text-gray-700">
            <Truck className="h-4 w-4 text-violet-600" />
            Delivers within {draft.shopDeliveryRadiusKm} km
          </p>
        ) : draft.shopDeliveryOffered === false ? (
          <p className="text-sm text-gray-600">In-store pickup only</p>
        ) : null}

        <div className="border-t border-neutral-100 pt-3 text-sm text-gray-700">
          {draft.phone.trim() ? (
            <p>{formatHostPhonePreview(draft.phoneCountryCode, draft.phone)}</p>
          ) : null}
          {draft.contactEmail.trim() ? <p>{draft.contactEmail.trim()}</p> : null}
        </div>
      </div>
    </div>
  );
};
