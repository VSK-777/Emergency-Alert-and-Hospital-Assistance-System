import React, { useState } from 'react';
import {
  Radio,
  RefreshCw,
  Download,
} from 'lucide-react';
import { useEmergencyStore } from '../../store/emergencyStore';
import { useNotificationStore } from '../../store/notificationStore';

export const QuickActionsBar: React.FC = () => {
  const { fetchActiveIncidents, isLoading } = useEmergencyStore();
  const { addNotification } = useNotificationStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      addNotification({
        title: 'Incident Audit Log Exported',
        message: 'Active emergency registry snapshot generated in CSV format.',
        type: 'system',
      });
    }, 600);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Radio className="h-4 w-4 text-red-600 dark:text-red-500" />
          Central Emergency Coordination Center
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Real-time incident monitoring, telemetry synchronization, and hospital network coordination
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Refresh Grid */}
        <button
          onClick={() => fetchActiveIncidents()}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Grid</span>
        </button>

        {/* Export Log */}
        <button
          onClick={handleExportData}
          disabled={isExporting}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{isExporting ? 'Exporting...' : 'Export Audit Log'}</span>
        </button>
      </div>
    </div>
  );
};
