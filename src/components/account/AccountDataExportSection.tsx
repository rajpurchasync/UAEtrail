import { useState } from 'react';
import { Download } from 'lucide-react';
import { api } from '../../api/services';
import { AppButton } from '../mobile/AppButton';

export const AccountDataExportSection = () => {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleExport = async () => {
    setMessage(null);
    setExporting(true);
    try {
      const blob = await api.downloadMyDataExport();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `uaetrail-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage('Download started.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="glass-card p-4 mb-3">
      <div className="flex items-start gap-3">
        <Download className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">Download my data</h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Export your profile, trips, favorites, orders, and rewards as JSON.
          </p>
          <AppButton
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="mt-3 !min-h-[44px] !py-2"
          >
            {exporting ? 'Preparing…' : 'Export data'}
          </AppButton>
          {message && <p className="text-xs text-gray-600 mt-2">{message}</p>}
        </div>
      </div>
    </div>
  );
};
