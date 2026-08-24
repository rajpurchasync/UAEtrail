import { useRef, useState } from 'react';
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
}

export const ProfilePhotoEditorField = ({
  value,
  name = 'Profile',
  onChange,
  disabled = false,
}: ProfilePhotoEditorFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editorFile, setEditorFile] = useState<File | null>(null);

  const onPickFile = (file: File | null) => {
    if (!file) return;
    setError(null);
    setEditorFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Profile photo</label>
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
              onClick={() => onChange('')}
              className="ios-btn min-h-[42px] px-3 text-sm text-red-600"
            >
              <X className="w-4 h-4" />
              Remove
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <PhotoEditorDialog
        open={Boolean(editorFile)}
        file={editorFile}
        title="Edit profile photo"
        onClose={() => setEditorFile(null)}
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
              keyPrefix: 'avatars',
              kind: 'avatar',
              filenameSuffix: 'avatar',
            });
            onChange(url);
            setEditorFile(null);
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
