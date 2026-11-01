import React, { useEffect, useState } from 'react';
import { deviceApi } from '../api/devices';
import type { SmartwatchDevice, DetectionEvent } from '../types';
import { Modal } from '../components/common/Modal';
import {
  Watch,
  BatteryCharging,
  Activity,
  Radio,
  RefreshCw,
  Cpu,
  Wifi,
  FileCode,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<SmartwatchDevice[]>([]);
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const [isPinging, setIsPinging] = useState(false);
  const [pingMessage, setPingMessage] = useState<string | null>(null);
  const [selectedRawJson, setSelectedRawJson] = useState<string | null>(null);

  const loadData = () => {
    deviceApi.getDevices().then(setDevices);
    deviceApi.getDetectionEvents().then(setEvents);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePing = async (id: number) => {
    setIsPinging(true);
    setPingMessage(null);
    try {
      const res = await deviceApi.pingDevice(id);
      setPingMessage(res.message);
      loadData();
    } catch (e: any) {
      setPingMessage('Ping failed: ' + e.message);
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Watch className="h-5 w-5 text-purple-400" />
            Smartwatch Fleet & IMU Sensor Telemetry
          </h2>
          <p className="text-xs text-slate-400">
            Wear OS device connectivity, 50Hz triple-axis IMU health, and raw accident impact forensics
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Poll Sensors
        </button>
      </div>

      {pingMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>{pingMessage}</span>
        </div>
      )}

      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {devices.map((device) => (
          <div
            key={device.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md space-y-4 hover:border-slate-700 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20 font-black">
                  <Watch className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    {device.deviceIdentifier}
                  </h3>
                  <p className="text-xs text-slate-400">
                    User: <strong className="text-slate-200">{device.userName || 'Sai Krishna VSK'}</strong>
                  </p>
                </div>
              </div>

              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                CONNECTED
              </span>
            </div>

            {/* Hardware Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl bg-slate-950/60 p-2.5 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center justify-center gap-1">
                  <BatteryCharging className="h-3 w-3 text-emerald-400" />
                  Battery
                </span>
                <p className="mt-1 text-base font-black text-white">{device.batteryLevel || 87}%</p>
              </div>

              <div className="rounded-xl bg-slate-950/60 p-2.5 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center justify-center gap-1">
                  <Activity className="h-3 w-3 text-purple-400" />
                  IMU Sampling
                </span>
                <p className="mt-1 text-base font-black text-purple-400">50 Hz</p>
              </div>

              <div className="rounded-xl bg-slate-950/60 p-2.5 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center justify-center gap-1">
                  <Cpu className="h-3 w-3 text-sky-400" />
                  Firmware
                </span>
                <p className="mt-1 text-[11px] font-mono font-bold text-sky-300">WearOS 4.0</p>
              </div>
            </div>

            {/* Telemetry Pipeline Details */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Active Sensors:</span>
                <span className="text-slate-200 font-medium">3-Axis Accel + 3-Axis Gyro</span>
              </div>
              <div className="flex justify-between">
                <span>Accident Algorithm:</span>
                <span className="text-rose-400 font-mono">VVIT-DualPeakThreshold (v2.1)</span>
              </div>
              <div className="flex justify-between">
                <span>Last Synchronized:</span>
                <span className="text-slate-200 font-mono">
                  {device.lastSyncedAt
                    ? new Date(device.lastSyncedAt).toLocaleTimeString()
                    : 'Just now'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => handlePing(device.id)}
                disabled={isPinging}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-purple-600/20 border border-purple-500/40 py-2 text-xs font-bold text-purple-300 hover:bg-purple-600 hover:text-white disabled:opacity-50 transition-colors"
              >
                <Zap className="h-3.5 w-3.5" />
                {isPinging ? 'Pinging Watch...' : 'Send Remote Diagnostic Ping'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detection Events Telemetry History */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-rose-500" />
              Accident Impact Forensics & Telemetry Log
            </h3>
            <p className="text-xs text-slate-400">
              Biomechanical G-force metrics recorded at the exact moment of impact
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3 pl-2">Event ID</th>
                <th className="pb-3">Event Type</th>
                <th className="pb-3">Peak Acceleration</th>
                <th className="pb-3">Angular Velocity</th>
                <th className="pb-3">Post-Impact Inactivity</th>
                <th className="pb-3">Timestamp</th>
                <th className="pb-3 text-right pr-2">Raw Telemetry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No physical accident telemetry events recorded yet.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 pl-2 font-mono text-slate-400">EV-{ev.id}</td>
                    <td className="py-3">
                      <span className="rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 text-[10px] font-bold">
                        {ev.eventType}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-rose-400">
                      {ev.accelerationMagnitude?.toFixed(2)} G
                    </td>
                    <td className="py-3 font-mono text-amber-400">
                      {ev.angularVelocity?.toFixed(2)} rad/s
                    </td>
                    <td className="py-3 font-mono text-purple-400">
                      {ev.postImpactInactivitySec} seconds
                    </td>
                    <td className="py-3 font-mono text-[11px] text-slate-400">
                      {ev.createdAt ? new Date(ev.createdAt).toLocaleTimeString() : 'Recent'}
                    </td>
                    <td className="py-3 text-right pr-2">
                      <button
                        onClick={() => setSelectedRawJson(ev.rawTelemetryJson || '{}')}
                        className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200 inline-flex items-center gap-1"
                      >
                        <FileCode className="h-3 w-3" />
                        View JSON
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw JSON Modal */}
      {selectedRawJson && (
        <Modal
          isOpen={!!selectedRawJson}
          onClose={() => setSelectedRawJson(null)}
          title="Raw Sensor Telemetry Payload"
          subtitle="Captured 50Hz triple-axis accelerometer and gyroscope buffer"
        >
          <div className="space-y-3">
            <pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96">
              {JSON.stringify(JSON.parse(selectedRawJson), null, 2)}
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedRawJson(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
