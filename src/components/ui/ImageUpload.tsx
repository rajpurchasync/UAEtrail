import { useRef, useState } from 'react';
import { IMAGE_UPLOAD_PRESETS, type ImageUploadPreset } from '../../constants/imageUploadPresets';
import { uploadMediaBlob } from '../../lib/mediaUpload';
import { EnvironmentImage } from './EnvironmentImage';
import { PhotoEditorDialog } from './PhotoEditorDialog';

interface ImageUploadProps {
  images: string[];
  onChange: (urls: string[]) => void;
  keyPrefix?: string;
  tenantId?: string;
  kind?: string;
  max?: number;
  label?: string;
  /** Standard upload behavior — events/locations skip crop; profile uses circle crop. */
  preset?: ImageUploadPreset;
}

interface UploadingFile {
  name: string;
  progress: 'uploading' | 'done' | 'error';
  url?: string;
}

export const ImageUpload = ({
  images,
  onChange,
  keyPrefix = 'uploads',
  tenantId,
  kind = 'image',
  max = 10,
  label = 'Images',
  preset = 'rectangle',
}: ImageUploadProps) => {
  const { skipEditor, shape, outputWidth, outputHeight } = IMAGE_UPLOAD_PRESETS[preset];

  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queuedImagesRef = useRef<string[] | null>(null);
  const queueRef = useRef<File[]>([]);

  const uploadFile = async (file: File, baseImages: string[]) => {
    const url = await uploadMediaBlob({
      blob: file,
      originalName: file.name,
      keyPrefix,
      tenantId,
      kind,
    });
    setUploading((prev) =>
      prev.map((u) =>
        u.name === file.name && u.progress === 'uploading' ? { ...u, progress: 'done', url } : u
      )
    );
    const nextImages = [...baseImages, url];
    queuedImagesRef.current = nextImages;
    onChange(nextImages);
  };

  const startUploadQueue = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const replaceMode = max === 1 && images.length >= 1;
    const remaining = max - images.length;
    if (!replaceMode && remaining <= 0) {
      setError(`Maximum ${max} images allowed`);
      return;
    }

    const toUpload = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, replaceMode ? 1 : remaining);

    if (toUpload.length === 0) {
      setError('Please choose image files only.');
      return;
    }

    const newUploading: UploadingFile[] = toUpload.map((f) => ({ name: f.name, progress: 'uploading' }));
    setUploading((prev) => [...prev, ...newUploading]);
    queuedImagesRef.current = replaceMode ? [] : [...images];
    if (inputRef.current) inputRef.current.value = '';

    if (skipEditor) {
      void (async () => {
        let base = queuedImagesRef.current ?? images;
        for (const file of toUpload) {
          try {
            await uploadFile(file, base);
            base = queuedImagesRef.current ?? base;
          } catch (err) {
            setUploading((prev) =>
              prev.map((u) =>
                u.name === file.name && u.progress === 'uploading' ? { ...u, progress: 'error' } : u
              )
            );
            setError(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
          }
        }
        queuedImagesRef.current = null;
        setTimeout(() => {
          setUploading((items) => items.filter((u) => u.progress === 'uploading'));
        }, 2000);
      })();
      return;
    }

    setEditorFile(toUpload[0]);
    queueRef.current = toUpload.slice(1);
  };

  const moveToNextFile = () => {
    if (queueRef.current.length === 0) {
      setEditorFile(null);
      queuedImagesRef.current = null;
      setTimeout(() => {
        setUploading((items) => items.filter((u) => u.progress === 'uploading'));
      }, 2000);
      return;
    }
    const next = queueRef.current.shift() ?? null;
    setEditorFile(next);
  };

  const cancelEditing = () => {
    setEditorFile(null);
    queueRef.current = [];
    queuedImagesRef.current = null;
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-xs text-gray-400">{images.length}/{max}</span>
      </div>

      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((url, i) => (
            <div key={`${url}-${i}`} className="relative group">
              <EnvironmentImage
                src={url}
                alt={`Upload ${i + 1}`}
                className={`w-20 h-16 object-cover border bg-gray-50 ${
                  preset === 'profile' ? 'rounded-full w-16 h-16' : 'rounded'
                }`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="64"><rect fill="%23f3f4f6" width="80" height="64"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="10">Error</text></svg>';
                }}
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {(images.length < max || max === 1) && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-emerald-400', 'bg-emerald-50/30'); }}
          onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-emerald-400', 'bg-emerald-50/30'); }}
          onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-emerald-400', 'bg-emerald-50/30'); startUploadQueue(e.dataTransfer.files); }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={max > 1 && preset !== 'profile'}
            className="hidden"
            onChange={(e) => startUploadQueue(e.target.files)}
          />
          <p className="text-sm text-gray-500">
            <span className="text-emerald-600 font-medium">
              {max === 1 && images.length > 0 ? 'Click to change photo' : 'Click to upload'}
            </span>
            {skipEditor ? ' or drag and drop' : ' then adjust before saving'}
          </p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, or WebP up to 20 MB</p>
        </div>
      )}

      {uploading.length > 0 && (
        <div className="space-y-1">
          {uploading.map((u, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {u.progress === 'uploading' && (
                <>
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-600">Uploading {u.name}...</span>
                </>
              )}
              {u.progress === 'done' && (
                <>
                  <span className="text-emerald-600">✓</span>
                  <span className="text-gray-600">{u.name}</span>
                </>
              )}
              {u.progress === 'error' && (
                <>
                  <span className="text-red-600">✗</span>
                  <span className="text-red-600">{u.name} failed</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {!skipEditor && (
        <PhotoEditorDialog
          open={Boolean(editorFile)}
          file={editorFile}
          title={preset === 'profile' ? 'Edit profile photo' : 'Adjust photo'}
          onClose={cancelEditing}
          applying={processing}
          shape={shape}
          outputWidth={outputWidth}
          outputHeight={outputHeight}
          onApply={async ({ blob }) => {
            if (!editorFile) return;
            setError(null);
            setProcessing(true);
            try {
              const url = await uploadMediaBlob({
                blob,
                originalName: editorFile.name,
                keyPrefix,
                tenantId,
                kind,
                filenameSuffix: preset === 'profile' ? 'avatar' : undefined,
              });
              setUploading((prev) =>
                prev.map((u) =>
                  u.name === editorFile.name && u.progress === 'uploading'
                    ? { ...u, progress: 'done', url }
                    : u
                )
              );
              const nextImages = queuedImagesRef.current ? [...queuedImagesRef.current, url] : [...images, url];
              queuedImagesRef.current = nextImages;
              onChange(nextImages);
              moveToNextFile();
            } catch (err) {
              setUploading((prev) =>
                prev.map((u) =>
                  u.name === editorFile.name && u.progress === 'uploading'
                    ? { ...u, progress: 'error' }
                    : u
                )
              );
              setError(err instanceof Error ? err.message : `Failed to upload ${editorFile.name}`);
            } finally {
              setProcessing(false);
            }
          }}
        />
      )}
    </div>
  );
};
