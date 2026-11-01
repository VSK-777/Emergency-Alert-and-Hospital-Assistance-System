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
        return <AlertTriangle className="h-5 w-5 text-rose-400" />;
      case 'dispatch':
        return <Radio className="h-5 w-5 text-amber-400" />;
      case 'sync':
        return <RefreshCw className="h-5 w-5 text-blue-400" />;
      default:
        return <ShieldCheck className="h-5 w-5 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={toggleDrawer}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md border-l border-slate-800 bg-slate-900 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-red-500/10 p-2 text-red-400">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Live Alert Stream</h2>
                <p className="text-xs text-slate-400">Real-time incident & dispatch feed</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={markAllAsRead}
                title="Mark all as read"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
              <button
                onClick={clearAll}
                title="Clear all"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={toggleDrawer}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="rounded-full bg-slate-800/80 p-4 text-slate-500 mb-3">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-slate-300">No active alerts</p>
                <p className="text-xs text-slate-500 mt-1">System is listening for incoming emergency telemetry.</p>
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
                  className={`group relative rounded-xl border p-3.5 transition-all cursor-pointer ${
                    item.read
                      ? 'border-slate-800/60 bg-slate-900/40 text-slate-400'
                      : 'border-red-500/30 bg-red-950/20 text-slate-200 hover:border-red-500/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
                        <span className="text-[10px] text-slate-500 ml-2 whitespace-nowrap">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">{item.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-800 bg-slate-950/40 p-3 text-center">
            <span className="text-[11px] text-slate-500">
              VVIT CSP Batch 8 · Emergency Alert and Hospital Assistance System
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
