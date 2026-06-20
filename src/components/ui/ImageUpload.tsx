import { useState, useRef } from 'react';
import { api } from '../../api/services';
import { getStoredSession } from '../../api/client';

interface ImageUploadProps {
  images: string[];
  onChange: (urls: string[]) => void;
  keyPrefix?: string;
  tenantId?: string;
  kind?: string;
  max?: number;
  label?: string;
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
  label = 'Images'
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const remaining = max - images.length;
    if (remaining <= 0) {
      setError(`Maximum ${max} images allowed`);
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    const newUploading: UploadingFile[] = toUpload.map((f) => ({ name: f.name, progress: 'uploading' }));
    setUploading((prev) => [...prev, ...newUploading]);

    const uploadOne = async (file: File): Promise<string | null> => {
      try {
        // 1. Get presigned URL
        const presign = await api.presignUpload({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          keyPrefix,
          tenantId,
          kind
        });

        // 2. Upload to S3 or local dev endpoint
        const isLocalUpload = presign.data.uploadUrl.includes('/media/upload-local/');
        const uploadHeaders: Record<string, string> = {
          'Content-Type': file.type || 'application/octet-stream'
        };
        if (isLocalUpload) {
          const session = getStoredSession();
          if (session?.accessToken) {
            uploadHeaders['Authorization'] = `Bearer ${session.accessToken}`;
          }
        }

        const putRes = await fetch(presign.data.uploadUrl, {
          method: 'PUT',
          headers: uploadHeaders,
          body: file
        });
        if (!putRes.ok) {
          throw new Error(`Upload failed (${putRes.status})`);
        }

        // 3. Commit the upload
        const committed = await api.commitUpload({
          key: presign.data.key,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          tenantId,
          kind
        });

        setUploading((prev) =>
          prev.map((u) =>
            u.name === file.name && u.progress === 'uploading'
              ? { ...u, progress: 'done', url: committed.data.url }
              : u
          )
        );
        return committed.data.url;
      } catch (err) {
        setUploading((prev) =>
          prev.map((u) =>
            u.name === file.name && u.progress === 'uploading'
              ? { ...u, progress: 'error' }
              : u
          )
        );
        setError(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
        return null;
      }
    };

    // Upload all files in parallel
    const results = await Promise.all(toUpload.map(uploadOne));
    const newUrls = results.filter((url): url is string => url !== null);

    if (newUrls.length > 0) {
      onChange([...images, ...newUrls]);
    }

    // Clear finished uploads after a delay
    setTimeout(() => {
      setUploading((prev) => prev.filter((u) => u.progress === 'uploading'));
    }, 2000);

    // Reset file input
    if (inputRef.current) inputRef.current.value = '';
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
                src={url}
                alt={`Upload ${i + 1}`}
                className="w-20 h-16 object-cover rounded border"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="64"><rect fill="%23f3f4f6" width="80" height="64"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="10">Error</text></svg>';
                }}
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {images.length < max && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-emerald-400', 'bg-emerald-50/30'); }}
          onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-emerald-400', 'bg-emerald-50/30'); }}
          onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-emerald-400', 'bg-emerald-50/30'); handleFiles(e.dataTransfer.files); }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <p className="text-sm text-gray-500">
            <span className="text-emerald-600 font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 10 MB each</p>
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
    </div>
  );
};
