import { MapPin, Users } from 'lucide-react';
import { resolveActivityTypeCoverImage } from '../../config/activityCoverImages';
import { HOME_PRODUCT_PREVIEW } from '../../content/homeLanding';
import { LandingSectionIntro } from './LandingSectionIntro';
import { LandingShell } from './LandingShell';

const PREVIEW_COVER = resolveActivityTypeCoverImage('hiking', null, { variantIndex: 1 });

export const HomeProductPreview = () => (
  <section className="py-8 md:py-14" aria-label="App preview">
    <LandingShell>
      <div className="md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] md:items-center md:gap-10 lg:gap-14">
        <LandingSectionIntro
          title={HOME_PRODUCT_PREVIEW.title}
          subtitle={HOME_PRODUCT_PREVIEW.subtitle}
          className="md:max-w-md"
        />

        <div className="mx-auto mt-6 w-full max-w-[16.5rem] md:mx-0 md:mt-0">
          <div className="landing-phone-frame">
            <div className="relative aspect-[9/16] overflow-hidden rounded-[20px] bg-neutral-900">
              <img
                src={PREVIEW_COVER}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
              <div className="absolute left-[24%] top-[22%] h-2.5 w-2.5 rounded-full bg-white ring-4 ring-emerald-500/90 shadow-md" />
              <div className="absolute left-[62%] top-[38%] h-2 w-2 rounded-full bg-white ring-[3px] ring-amber-400/90 shadow-md" />
              <div className="absolute left-[42%] top-[52%] h-2 w-2 rounded-full bg-white ring-[3px] ring-sky-400/90 shadow-md" />

              <div className="absolute inset-x-2.5 bottom-2.5 rounded-xl bg-white/95 p-3 shadow-xl backdrop-blur-sm">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <MapPin className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="truncate text-[13px] font-semibold text-neutral-900">
                      {HOME_PRODUCT_PREVIEW.activityTitle}
                    </p>
                    <p className="mt-0.5 text-[11px] text-neutral-500">{HOME_PRODUCT_PREVIEW.activityMeta}</p>
                    <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800">
                      <Users className="h-3 w-3" aria-hidden />
                      {HOME_PRODUCT_PREVIEW.activitySpots}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LandingShell>
  </section>
);
