import type { PhotoShape } from '../components/ui/PhotoEditorDialog';

export type ImageUploadPreset = 'activity' | 'location' | 'rectangle' | 'profile';

export interface ImageUploadPresetConfig {
  skipEditor: boolean;
  shape: PhotoShape;
  outputWidth: number;
  outputHeight: number;
}

/** Standard image handling across the app — no per-upload shape/size controls. */
export const IMAGE_UPLOAD_PRESETS: Record<ImageUploadPreset, ImageUploadPresetConfig> = {
  activity: {
    skipEditor: true,
    shape: 'rectangle',
    outputWidth: 1600,
    outputHeight: 1200,
  },
  location: {
    skipEditor: true,
    shape: 'rectangle',
    outputWidth: 1600,
    outputHeight: 1200,
  },
  rectangle: {
    skipEditor: false,
    shape: 'rectangle',
    outputWidth: 1600,
    outputHeight: 1200,
  },
  profile: {
    skipEditor: false,
    shape: 'circle',
    outputWidth: 512,
    outputHeight: 512,
  },
};
