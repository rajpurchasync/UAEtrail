import { useRef, useState } from 'react';
import { uploadMediaBlob } from '../../lib/mediaUpload';
import { formatEnvironmentUrl } from '../../utils/formatEnvironmentUrl';
import { PhotoEditorDialog, type PhotoShape } from './PhotoEditorDialog';

interface ImageUploadProps {
  images: string[];
  onChange: (urls: string[]) => void;
  keyPrefix?: string;
  tenantId?: string;
  kind?: string;
  max?: number;
  label?: string;
  outputWidth?: number;
  outputHeight?: number;
  allowOutputSizeChange?: boolean;
  shapeOptions?: PhotoShape[];
  defaultShape?: PhotoShape;
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
  outputWidth = 1600,
  outputHeight = 1200,
  allowOutputSizeChange = true,
  shapeOptions = ['rectangle', 'circle'],
  defaultShape = 'rectangle',
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queuedImagesRef = useRef<string[] | null>(null);
  const queueRef = useRef<File[]>([]);

  const startEditorQueue = (files: FileList | null) => {
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
    setEditorFile(toUpload[0]);
    queueRef.current = toUpload.slice(1);
    if (inputRef.current) inputRef.current.value = '';
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

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={formatEnvironmentUrl(url)}
                alt={`Upload ${i + 1}`}
                className="w-20 h-16 object-cover rounded border"
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

      {/* Upload area — always available for single-image replace */}
      {(images.length < max || max === 1) && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-emerald-400', 'bg-emerald-50/30'); }}
          onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-emerald-400', 'bg-emerald-50/30'); }}
          onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-emerald-400', 'bg-emerald-50/30'); startEditorQueue(e.dataTransfer.files); }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={max > 1}
            className="hidden"
            onChange={(e) => startEditorQueue(e.target.files)}
          />
          <p className="text-sm text-gray-500">
            <span className="text-emerald-600 font-medium">
              {max === 1 && images.length > 0 ? 'Click to change photo' : 'Click to upload'}
            </span>{' '}
            then crop/rotate before upload
          </p>
          <p className="text-xs text-gray-400 mt-1">Only the processed final image is stored</p>
        </div>
      )}

      {/* Upload progress indicators */}
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

      <PhotoEditorDialog
        open={Boolean(editorFile)}
        file={editorFile}
        title="Edit photo"
        onClose={cancelEditing}
        applying={processing}
        initialWidth={outputWidth}
        initialHeight={outputHeight}
        allowOutputSizeChange={allowOutputSizeChange}
        shapeOptions={shapeOptions}
        defaultShape={defaultShape}
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
    </div>
  );
};
