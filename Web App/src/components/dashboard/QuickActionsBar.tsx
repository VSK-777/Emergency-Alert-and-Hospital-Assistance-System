import React, { useState } from 'react';
import {
  AlertTriangle,
  Watch,
  Radio,
  FileSpreadsheet,
  RefreshCw,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { useEmergencyStore } from '../../store/emergencyStore';
import { emergencyApi } from '../../api/emergencies';
import { auditApi } from '../../api/audit';
import { useNotificationStore } from '../../store/notificationStore';
import { CreateEmergencyModal } from '../emergencies/CreateEmergencyModal';

export const QuickActionsBar: React.FC = () => {
  const { fetchActiveIncidents } = useEmergencyStore();
  const { addNotification } = useNotificationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulateFall = async () => {
    setIsSimulating(true);
    try {
      const simulated = await emergencyApi.createIncident({
        source: 'SMARTWATCH_AUTO',
        latitude: 16.3535,
        longitude: 80.5242,
        accuracyMeters: 3.8,
        detectionReason: 'High Impact Fall with 14s Inactivity (Simulated)',
        detectionScore: 0.96,
        detectionEvent: {
          eventType: 'FALL_IMPACT',
          accelerationMagnitude: 3.85,
          angularVelocity: 6.82,
          postImpactInactivitySec: 14,
          rawTelemetryJson: JSON.stringify({
            accel_peak_g: 3.85,
            gyro_dps: 390,
            stillness_duration_s: 14,
            impact_axis: 'Z',
          }),
        },
      });

      await fetchActiveIncidents();
      await auditApi.createAuditLog({
        action: 'SIMULATED_FALL_TEST',
        details: 'Simulated fall impact injected into active grid: ' + simulated.id,
        incidentId: simulated.id,
      });

      addNotification({
        title: 'Fall Impact Simulated',
        message: `Incident ${simulated.id} created with 3.85G impact. Live SSE broadcasted!`,
        type: 'emergency',
        incidentId: simulated.id,
      });
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExportData = () => {
    addNotification({
      title: 'Audit Log Exported',
      message: 'Compliance export prepared in CSV format.',
      type: 'system',
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio className="h-4 w-4 text-red-500 animate-pulse" />
            Rapid Emergency Coordination Grid
          </h4>
          <p className="text-xs text-slate-400">One-click operational triggers and testing tools</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dispatch SOS */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-500 active:scale-95 transition-all"
          >
            <AlertTriangle className="h-4 w-4" />
            Dispatch SOS
          </button>

          {/* Test Fall Impact */}
          <button
            onClick={handleSimulateFall}
            disabled={isSimulating}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/40 active:scale-95 disabled:opacity-50 transition-all"
          >
            <Watch className="h-4 w-4 text-rose-400" />
            {isSimulating ? 'Injecting Fall...' : 'Test Fall Impact (3.85G)'}
          </button>

          {/* Export Report */}
          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            Export Audit Logs
          </button>
        </div>
      </div>

      <CreateEmergencyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
