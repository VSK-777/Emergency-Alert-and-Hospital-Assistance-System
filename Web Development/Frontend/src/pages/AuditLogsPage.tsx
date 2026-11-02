import React, { useEffect, useState } from 'react';
import { auditApi } from '../api/audit';
import type { AuditLog } from '../types';
import { Badge } from '../components/common/Badge';
import {
  FileText,
  Search,
  Download,
  ShieldCheck,
  RefreshCw,
  Clock,
  User,
  Radio,
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await auditApi.getAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleExportCsv = () => {
    const headers = ['Log ID', 'Action', 'Actor Email', 'Actor Role', 'Incident ID', 'Details', 'Timestamp'];
    const rows = logs.map((l) => [
      l.id,
      l.action,
      l.actorEmail || 'SYSTEM',
      l.actorRole || 'SYSTEM',
      l.incidentId || '',
      `"${(l.details || '').replace(/"/g, '""')}"`,
      l.createdAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vvit_csp_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.actorEmail && l.actorEmail.toLowerCase().includes(search.toLowerCase())) ||
      (l.details && l.details.toLowerCase().includes(search.toLowerCase())) ||
      (l.incidentId && l.incidentId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Immutable Audit Trail & Regulatory Logs
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cryptographically timestamped action history for medical and emergency dispatch accountability
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-700 active:scale-95 transition-all"
          >
            <Download className="h-4 w-4" />
            Export Compliance CSV
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex items-center justify-between transition-colors">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, operator email, or incident ID..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium pl-4">
          Showing {filteredLogs.length} verified log entries
        </span>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="pb-3 pl-2">Log ID</th>
                <th className="pb-3">Action</th>
                <th className="pb-3">Actor / Operator</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Incident Reference</th>
                <th className="pb-3">Details</th>
                <th className="pb-3 text-right pr-2">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    No audit records match search query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 pl-2 font-mono font-bold text-slate-900 dark:text-white">#{log.id}</td>
                    <td className="py-3">
                      <span className="rounded bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 px-2 py-0.5 text-[10px] font-bold border border-purple-200 dark:border-purple-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {log.actorEmail || 'SYSTEM'}
                    </td>
                    <td className="py-3">
                      <Badge status={log.actorRole || 'SYSTEM'} variant="role" />
                    </td>
                    <td className="py-3 font-mono text-blue-600 dark:text-blue-400">
                      {log.incidentId ? log.incidentId.slice(0, 10) : '—'}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{log.details}</td>
                    <td className="py-3 text-right pr-2 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
