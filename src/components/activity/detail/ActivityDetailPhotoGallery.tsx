import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { EnvironmentImage } from '../../ui/EnvironmentImage';

type ActivityDetailPhotoGalleryProps = {
  activity: ActivityDetailDTO;
};

/** Activity-attached images from organize capture (`activity.images`). */
export const ActivityDetailPhotoGallery = ({ activity }: ActivityDetailPhotoGalleryProps) => {
  const images = (activity.images ?? []).map((src) => src?.trim()).filter(Boolean);
  if (images.length === 0) return null;

  return (
    <section className="rounded-xl border border-neutral-100 bg-white p-4" aria-label="Photos">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">Photos</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((src, index) => (
          <EnvironmentImage
            key={`${src}-${index}`}
            src={src}
            alt=""
            className="rounded-xl aspect-video w-full object-cover bg-neutral-100"
            loading="lazy"
          />
        ))}
      </div>
    </section>
  );
};
