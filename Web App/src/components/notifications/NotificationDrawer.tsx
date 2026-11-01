import React from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import { X, Bell, CheckCheck, Trash2, AlertTriangle, ShieldCheck, Radio, RefreshCw } from 'lucide-react';
import { useEmergencyStore } from '../../store/emergencyStore';

export const NotificationDrawer: React.FC = () => {
  const { notifications, isOpen, toggleDrawer, markAsRead, markAllAsRead, clearAll } =
    useNotificationStore();
  const { selectIncidentById } = useEmergencyStore();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />;
      case 'dispatch':
        return <Radio className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'sync':
        return <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />;
      default:
        return <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={toggleDrawer}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col transition-colors">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 p-2 text-red-600 dark:text-red-400">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Emergency Notifications</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Real-time alert & incident dispatch logs</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={markAllAsRead}
                title="Mark all as read"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
              <button
                onClick={clearAll}
                title="Clear all"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={toggleDrawer}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4 text-slate-400 dark:text-slate-500 mb-3">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No active alerts</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Real-time telemetry and incident alerts will appear here as they are received.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    markAsRead(item.id);
                    if (item.incidentId) {
                      selectIncidentById(item.incidentId);
                      toggleDrawer();
                    }
                  }}
                  className={`group relative rounded-xl border p-3.5 transition-all cursor-pointer shadow-xs ${
                    item.read
                      ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400'
                      : 'border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 text-slate-900 dark:text-slate-100 hover:border-red-300 dark:hover:border-red-800/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                        {item.message}
                      </p>
                      {item.incidentId && (
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                            ID: {item.incidentId.slice(0, 8)}
                          </span>
                          <span className="text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
                            View details &rarr;
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
