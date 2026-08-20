import { useRef, useState } from 'react';
import { Upload, Loader2, FileText } from 'lucide-react';
import { api } from '../../api/services';
import { getStoredSession } from '../../api/client';
import { formatEnvironmentUrl } from '../../utils/formatEnvironmentUrl';

interface AssetKeyUploadProps {
  label: string;
  value?: string | null;
  onChange: (key: string | null) => void;
  accept?: string;
  keyPrefix?: string;
  kind?: string;
}

/** Upload a file and store its storage key (GPX, PDF — not public image URLs). */
export const AssetKeyUpload = ({
  label,
  value,
  onChange,
  accept = '.gpx,.pdf',
  keyPrefix = 'locations',
  kind = 'location-asset',
}: AssetKeyUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const presign = await api.presignUpload({
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        keyPrefix,
        kind,
      });

      const uploadUrl = formatEnvironmentUrl(presign.data.uploadUrl);
      const isLocalUpload = uploadUrl.includes('/media/upload-local/');
      const headers: Record<string, string> = {
        'Content-Type': file.type || 'application/octet-stream',
      };
      if (isLocalUpload) {
        const session = getStoredSession();
        if (session?.accessToken) {
          headers.Authorization = `Bearer ${session.accessToken}`;
        }
      }

      const putRes = await fetch(uploadUrl, { method: 'PUT', headers, body: file });
      if (!putRes.ok) throw new Error(`Upload failed (${putRes.status})`);

      await api.commitUpload({
        key: presign.data.key,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        kind,
      });

      onChange(presign.data.key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const filename = value?.split('/').pop();

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      {value ? (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
          <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="text-sm text-gray-800 truncate flex-1">{filename}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-red-600 font-medium hover:underline shrink-0"
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-600 hover:border-emerald-400 hover:text-emerald-700 transition-colors disabled:opacity-60"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading…' : 'Choose file'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};
