import { ChevronRight, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { ShopPublicDTO } from '@uaetrail/shared-types';
import { DirectionsControl } from '../ui/DirectionsControl';
import { personProfilePath } from '../../utils/organisationLinks';
import { messagesRouteForRole } from '../../utils/authRouting';
import { useAuth } from '../../context/AuthContext';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import { SecureAvatar } from '../ui/SecureAvatar';

interface ShopContactSectionProps {
  shop: Pick<
    ShopPublicDTO,
    | 'region'
    | 'latitude'
    | 'longitude'
    | 'contactPersonName'
    | 'contactPersonAvatar'
    | 'contactPersonUserId'
    | 'contactPhone'
    | 'contactEmail'
  >;
}

const contactRowClass =
  'flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3.5 py-3 transition-colors hover:bg-neutral-50 active:bg-neutral-100';

/** Shop contact block — reach-out actions first, location links grouped below. */
export const ShopContactSection = ({ shop }: ShopContactSectionProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const hasCoords = shop.latitude != null && shop.longitude != null;
  const hasReachOut = Boolean(shop.contactPhone || shop.contactEmail);
  const hasPerson = Boolean(shop.contactPersonName);
  const contactPersonPath = personProfilePath(shop.contactPersonUserId);
  const messageShopPath =
    shop.contactPersonUserId && user
      ? messagesRouteForRole(user.role, shop.contactPersonUserId)
      : shop.contactPersonUserId
        ? buildSignInRedirect(location, { focusSelector: '[data-shop-message]' }).href
        : null;
  const hasLocation = Boolean(shop.region || hasCoords);

  if (!hasReachOut && !hasPerson && !hasLocation) return null;

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Contact</h2>

      <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
        {(hasReachOut || hasPerson) && (
          <div className="p-4 space-y-2">
            {shop.contactPhone && (
              <a href={`tel:${shop.contactPhone}`} className={contactRowClass}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Phone className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                    Call shop
                  </span>
                  <span className="block text-sm font-semibold text-neutral-900 truncate">{shop.contactPhone}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
              </a>
            )}

            {shop.contactEmail && (
              <a href={`mailto:${shop.contactEmail}`} className={contactRowClass}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                  <Mail className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                    Email
                  </span>
                  <span className="block text-sm font-semibold text-neutral-900 truncate">{shop.contactEmail}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
              </a>
            )}

            {messageShopPath && (
              <Link to={messageShopPath} data-shop-message className={contactRowClass}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                  <MessageCircle className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                    Message shop
                  </span>
                  <span className="block text-sm font-semibold text-neutral-900 truncate">
                    Chat with {shop.contactPersonName ?? 'the shop owner'}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
              </Link>
            )}

            {hasPerson &&
              (contactPersonPath ? (
                <Link to={contactPersonPath} className={contactRowClass}>
                  <SecureAvatar
                    src={shop.contactPersonAvatar}
                    name={shop.contactPersonName!}
                    className="h-10 w-10 shrink-0 text-sm ring-2 ring-white"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-neutral-900 truncate">
                      {shop.contactPersonName}
                    </span>
                    <span className="block text-xs text-neutral-500">Shop contact · view profile</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
                </Link>
              ) : (
                <div className={`${contactRowClass} cursor-default hover:bg-neutral-50/80 active:bg-neutral-50/80`}>
                  <SecureAvatar
                    src={shop.contactPersonAvatar}
                    name={shop.contactPersonName!}
                    className="h-10 w-10 shrink-0 text-sm ring-2 ring-white"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-neutral-900 truncate">
                      {shop.contactPersonName}
                    </span>
                    <span className="block text-xs text-neutral-500">Shop contact</span>
                  </span>
                </div>
              ))}
          </div>
        )}

        {hasLocation && (
          <div className="border-t border-neutral-100 bg-gradient-to-b from-emerald-50/40 to-white p-4">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <MapPin className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Visit us</p>
                <p className="mt-0.5 text-sm font-semibold text-neutral-900">{shop.region ?? 'View on map'}</p>
              </div>
            </div>

            {hasCoords && (
              <DirectionsControl
                lat={shop.latitude!}
                lng={shop.longitude!}
                variant="compact"
                className="mt-3"
                includeViewOnMap
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
};
