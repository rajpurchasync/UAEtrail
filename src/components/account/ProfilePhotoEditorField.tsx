import { useEffect, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { IMAGE_UPLOAD_PRESETS } from '../../constants/imageUploadPresets';
import { uploadMediaBlob } from '../../lib/mediaUpload';
import { PhotoEditorDialog } from '../ui/PhotoEditorDialog';
import { SecureAvatar } from '../ui/SecureAvatar';

interface ProfilePhotoEditorFieldProps {
  value?: string;
  name?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  label?: string;
  editorTitle?: string;
  keyPrefix?: string;
  kind?: string;
  /** After crop/upload or remove — use to persist without a separate Save step. */
  onPhotoCommitted?: (url: string) => void | Promise<void>;
  /** Open the file picker when mounted (e.g. profile avatar edit sheet). */
  autoOpenPicker?: boolean;
  onEditorOpenChange?: (open: boolean) => void;
  /** Crop-only flow — hide preview / choose / remove row (profile avatar picker). */
  suppressChrome?: boolean;
  /** Called when the user cancels crop or dismisses the file picker in a chromeless flow. */
  onDismiss?: () => void;
}

export const ProfilePhotoEditorField = ({
  value,
  name = 'Profile',
  onChange,
  disabled = false,
  label = 'Profile photo',
  editorTitle = 'Edit profile photo',
  keyPrefix = 'avatars',
  kind = 'avatar',
  onPhotoCommitted,
  autoOpenPicker = false,
  onEditorOpenChange,
  suppressChrome = false,
  onDismiss,
}: ProfilePhotoEditorFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autoOpenOnceRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editorFile, setEditorFile] = useState<File | null>(null);

  const onPickFile = (file: File | null) => {
    if (!file) return;
    setError(null);
    setEditorFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  useEffect(() => {
    if (!autoOpenPicker) {
      autoOpenOnceRef.current = false;
      return;
    }
    if (autoOpenOnceRef.current || disabled || uploading || editorFile) return;
    autoOpenOnceRef.current = true;
    inputRef.current?.click();
  }, [autoOpenPicker, disabled, uploading, editorFile]);

  useEffect(() => {
    onEditorOpenChange?.(Boolean(editorFile));
  }, [editorFile, onEditorOpenChange]);

  const dismissChromeless = () => {
    if (suppressChrome) onDismiss?.();
  };

  return (
    <div className={suppressChrome ? 'sr-only' : 'space-y-3'}>
      {!suppressChrome && (
        <>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">{label}</label>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-16 w-16 shrink-0 rounded-full overflow-hidden ring-1 ring-black/10 bg-gray-100">
              {value ? (
                <SecureAvatar src={value} name={name} className="h-full w-full text-lg" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[10px] font-semibold text-gray-400">
                  No photo
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => inputRef.current?.click()}
                className="ios-btn min-h-[42px] px-3 text-sm"
              >
                <Upload className="w-4 h-4" />
                Choose photo
              </button>
              {value && (
                <button
                  type="button"
                  disabled={disabled || uploading}
                  onClick={() => {
                    onChange('');
                    void onPhotoCommitted?.('');
                  }}
                  className="ios-btn min-h-[42px] px-3 text-sm text-red-600"
                >
                  <X className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          if (!file) {
            dismissChromeless();
            return;
          }
          onPickFile(file);
        }}
      />

      {error && !suppressChrome && <p className="text-xs text-red-600">{error}</p>}

      <PhotoEditorDialog
        open={Boolean(editorFile)}
        file={editorFile}
        title={editorTitle}
        onClose={() => {
          setEditorFile(null);
          dismissChromeless();
        }}
        applying={uploading}
        shape={IMAGE_UPLOAD_PRESETS.profile.shape}
        outputWidth={IMAGE_UPLOAD_PRESETS.profile.outputWidth}
        outputHeight={IMAGE_UPLOAD_PRESETS.profile.outputHeight}
        onApply={async ({ blob }) => {
          if (!editorFile) return;
          setError(null);
          setUploading(true);
          try {
            const url = await uploadMediaBlob({
              blob,
              originalName: editorFile.name,
              keyPrefix,
              kind,
              filenameSuffix: 'avatar',
            });
            onChange(url);
            setEditorFile(null);
            await onPhotoCommitted?.(url);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload profile photo.');
          } finally {
            setUploading(false);
          }
        }}
      />
    </div>
  );
};
