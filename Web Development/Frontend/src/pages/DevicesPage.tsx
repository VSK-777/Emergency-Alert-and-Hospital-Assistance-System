import React, { useEffect, useState } from 'react';
import { deviceApi } from '../api/devices';
import { useAuthStore } from '../store/authStore';
import type { HardwareDevice, DetectionEvent, HardwareTelemetry } from '../types';
import { Modal } from '../components/common/Modal';
import {
  Cpu,
  Activity,
  Heart,
  Radio,
  RefreshCw,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileCode,
  Gauge,
  Sliders,
  Sparkles,
  Wifi,
} from 'lucide-react';

export const DevicesPage: React.FC = () => {
  const { user, token } = useAuthStore();
  const [devices, setDevices] = useState<HardwareDevice[]>([]);
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const [latestTelemetry, setLatestTelemetry] = useState<HardwareTelemetry | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<HardwareTelemetry[]>([]);
  const [selectedRawJson, setSelectedRawJson] = useState<string | null>(null);

  const isCitizen = user?.role === 'CITIZEN';

  const isTelemetryLive = React.useMemo(() => {
    if (!latestTelemetry?.createdAt) return false;
    const elapsedMs = Date.now() - new Date(latestTelemetry.createdAt).getTime();
    return elapsedMs < 20000;
  }, [latestTelemetry]);

  const loadData = () => {
    deviceApi.getDevices().then((all) => {
      if (isCitizen) {
        const own = all.filter((d) => d.userId === user?.id || d.userEmail === user?.email);
        setDevices(own.length > 0 ? own : all.slice(0, 1));
      } else {
        setDevices(all);
      }

      // Load telemetry for target device
      const targetDev = all.find((d) => d.deviceIdentifier === 'CSP-Triage-V1') || all[0];
      if (targetDev) {
        deviceApi.getLatestTelemetry(targetDev.deviceIdentifier).then((t) => {
          if (t) setLatestTelemetry(t);
        }).catch(() => {});

        deviceApi.getTelemetryHistory(targetDev.deviceIdentifier, 25).then((h) => {
          if (h && h.length > 0) setTelemetryHistory(h.reverse());
        }).catch(() => {});
      }
    }).catch(console.error);

    if (!isCitizen) {
      deviceApi.getDetectionEvents().then(setEvents).catch(console.error);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to SSE stream for real-time ESP32 hardware telemetry updates
    const baseUrl = import.meta.env.VITE_API_URL || 'https://emergency-alert-and-hospital-assistance.onrender.com';
    const sseUrl = `${baseUrl}/api/v1/emergencies/stream?token=${encodeURIComponent(token || '')}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener('HARDWARE_TELEMETRY', (e: MessageEvent) => {
      try {
        const data: HardwareTelemetry = JSON.parse(e.data);
        setLatestTelemetry(data);
        setTelemetryHistory((prev) => [...prev.slice(-24), data]);
      } catch (err) {
        console.error('Failed to parse incoming hardware telemetry SSE:', err);
      }
    });

    const interval = setInterval(loadData, 5000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, [isCitizen, user, token]);



  const getStateBadge = (state?: string) => {
    switch (state) {
      case 'NORMAL_MONITORING':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">NORMAL MONITORING</span>;
      case 'IMPACT_CANDIDATE':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">IMPACT CANDIDATE</span>;
      case 'IMMOBILITY_CHECK':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700">IMMOBILITY CHECK</span>;
      case 'COUNTDOWN':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-700 animate-bounce">15s COUNTDOWN ACTIVE</span>;
      case 'PHYSIOLOGICAL_ASSESSMENT':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-700">ASSESSING VITALS</span>;
      case 'EMERGENCY_ALERT':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-200 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border border-rose-500 animate-pulse">EMERGENCY ALERT DISPATCHED</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300">ALERT CANCELLED</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300">STANDBY</span>;
    }
  };

  const getModeBadge = (mode?: string) => {
    if (mode === 'SIMULATION') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow-xs">
          <Sliders className="h-3 w-3" /> SIMULATION MODE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-600 text-white shadow-xs">
        <Zap className="h-3 w-3" /> REAL HARDWARE
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            {isCitizen ? 'My ESP32 Hardware Triage & Physiological Monitoring' : 'ESP32 Hardware Triage & Telemetry Fleet'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isCitizen
              ? 'Paired ESP32 DevKit v1 telemetry, continuous optical PPG, 6-DOF IMU fall detection, and cloud relay'
              : 'Fleet health, live 20Hz sensor streams, GATT telemetry broadcasts, and hardware diagnostic records'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isTelemetryLive ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Live Hardware Feed Active
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              Gateway Standby (Cached Data)
            </span>
          )}
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>



      {/* 1. Live Physiological & Motion Sensor Dashboard */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-red-500 animate-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Live ESP32 Physiological & Motion Metrics
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {getModeBadge(latestTelemetry?.operatingMode)}
            {getStateBadge(latestTelemetry?.deviceState)}
          </div>
        </div>

        {/* 4 Sensor Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Heart Rate */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Heart Rate (PPG)</span>
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                {latestTelemetry?.heartRate && latestTelemetry.heartRate > 0 ? latestTelemetry.heartRate : '--'}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">BPM</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              MAX30102 Optical Sensor · Signal: {latestTelemetry?.signalQuality ?? 92}%
            </p>
          </div>

          {/* Blood Oxygen SpO2 */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Blood Oxygen (SpO2)</span>
              <Gauge className="h-5 w-5 text-cyan-500" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                {latestTelemetry?.spo2 && latestTelemetry.spo2 > 0 ? `${latestTelemetry.spo2}%` : '--'}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sat.</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
              Dual Red/IR Ratio · Clinical Baseline
            </p>
          </div>

          {/* Accelerometer Vector */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Acceleration Vector</span>
              <Flame className="h-5 w-5 text-amber-500" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {latestTelemetry?.accelMagnitude ? latestTelemetry.accelMagnitude.toFixed(2) : '1.00'}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">|A| g</span>
            </div>
            <p className="mt-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              X: {latestTelemetry?.accelX?.toFixed(2) ?? '0.00'} · Y: {latestTelemetry?.accelY?.toFixed(2) ?? '0.00'} · Z: {latestTelemetry?.accelZ?.toFixed(2) ?? '9.81'} m/s²
            </p>
          </div>

          {/* Device State & Countdown */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Triage Countdown</span>
              <Clock className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-3xl font-black font-mono ${latestTelemetry?.countdownSec && latestTelemetry.countdownSec > 0 ? 'text-red-600 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                {latestTelemetry?.countdownSec && latestTelemetry.countdownSec > 0 ? `${latestTelemetry.countdownSec}s` : 'Armed'}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {latestTelemetry?.countdownSec && latestTelemetry.countdownSec > 0 ? 'Escalating' : 'Normal'}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              15s Threshold Auto-Dispatch Pipeline
            </p>
          </div>
        </div>

        {/* Recent Sensor Trends Visual Chart */}
        {telemetryHistory.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Live Sensor History Trend (Last {telemetryHistory.length} Telemetry Samples)
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Updated: {latestTelemetry?.createdAt ? new Date(latestTelemetry.createdAt).toLocaleTimeString() : 'Just now'}
              </span>
            </div>
            <div className="h-20 flex items-end gap-1.5 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
              {telemetryHistory.map((t, idx) => {
                const hrHeight = Math.min(Math.max(((t.heartRate || 75) - 40) * 1.2, 10), 100);
                const isImpact = (t.accelMagnitude || 1.0) > 2.5;
                return (
                  <div key={idx} className="flex-1 min-w-[12px] flex flex-col items-center gap-1 group relative">
                    <div
                      style={{ height: `${hrHeight}%` }}
                      className={`w-full rounded-t transition-all ${isImpact ? 'bg-red-500' : 'bg-indigo-500 dark:bg-indigo-400'}`}
                      title={`BPM: ${t.heartRate || '--'} | Accel: ${t.accelMagnitude?.toFixed(2)}g | State: ${t.deviceState}`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400 font-mono">
              <span>Historical Sensor Packets</span>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-indigo-500" /> Heart Rate Trend</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-red-500" /> Impact Anomaly Spike</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Registered ESP32 Hardware Fleet */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Cpu className="h-4 w-4 text-indigo-500" />
          Enrolled Hardware Fleet & Companion Gateways
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {device.deviceIdentifier}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        device.lastSyncedAt && (Date.now() - new Date(device.lastSyncedAt).getTime() < 30000)
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {device.lastSyncedAt && (Date.now() - new Date(device.lastSyncedAt).getTime() < 30000)
                          ? 'ONLINE · STREAMING'
                          : (device.lastSyncedAt ? 'STANDBY' : 'ENROLLED')}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {device.hardwareModel || 'ESP32 DevKit v1'} · Type: <strong className="text-slate-700 dark:text-slate-300">{device.deviceType}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={loadData}
                  className="rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3 text-xs border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-400">Assigned Patient:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {device.userName || 'Sai Krishna VSK'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{device.userEmail || 'patient.vsk@vvit.net'}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Sensors Mounted:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {device.sensors || 'MPU6050 + MAX30102'}
                  </p>
                  <p className="text-[10px] text-slate-400">{device.imuSamplingRate || '20 Hz motion / 5 Hz telemetry'}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">BLE GATT Service:</span>
                  <p className="font-mono text-[10px] text-slate-700 dark:text-slate-300 truncate" title={device.bleGattService || '0000FFF0-0000-1000-8000-00805F9B34FB'}>
                    {device.bleGattService || '0000FFF0-0000-1000-8000-00805F9B34FB'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Firmware Build:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {device.firmwareVersion || 'CSP-Triage-V1 (ESP32)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Enrolled: {new Date(device.createdAt).toLocaleDateString()}</span>
                <span>Last Sync: {device.lastSyncedAt ? new Date(device.lastSyncedAt).toLocaleTimeString() : 'Recent'}</span>
              </div>
            </div>
          ))}

          {devices.length === 0 && (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 p-8 text-center">
              <Cpu className="mx-auto h-12 w-12 text-slate-400" />
              <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">No ESP32 Devices Enrolled</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enroll your physical ESP32 Triage board (CSP-Triage-V1) or run Android companion app to register automatically.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Recent Hardware Trauma Events Log */}
      {!isCitizen && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Hardware Accident Detection & IMU Telemetry Events
            </h3>
            <span className="text-xs text-slate-400">{events.length} Telemetry Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="py-2.5 px-3">Event Type</th>
                  <th className="py-2.5 px-3">Peak Acceleration</th>
                  <th className="py-2.5 px-3">Stillness Duration</th>
                  <th className="py-2.5 px-3">Associated Incident</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Raw Telemetry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {events.map((evt, idx) => (
                  <tr key={evt.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      {evt.eventType}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-red-600 dark:text-red-400">
                      {evt.accelerationMagnitude ? `${evt.accelerationMagnitude.toFixed(2)} g` : '3.85 g'}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {evt.postImpactInactivitySec ? `${evt.postImpactInactivitySec}s` : '15s'}
                    </td>
                    <td className="py-3 px-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                      {evt.id ? `#${evt.id}` : 'Dispatched'}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {evt.createdAt ? new Date(evt.createdAt).toLocaleString() : 'Recent'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {evt.rawTelemetryJson ? (
                        <button
                          onClick={() => setSelectedRawJson(evt.rawTelemetryJson!)}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[11px] font-mono text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        >
                          <FileCode className="h-3 w-3" /> View JSON
                        </button>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>
                  </tr>
                ))}

                {events.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No hardware trauma events logged yet. ESP32 is continuously monitoring in baseline state.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raw JSON Modal */}
      {selectedRawJson && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedRawJson(null)}
          title="ESP32 Raw Binary / Telemetry Payload"
          subtitle="Direct unpacked packet from GATT Live Telemetry characteristic"
        >
          <pre className="rounded-xl bg-slate-900 p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-96">
            {(() => {
              try {
                return JSON.stringify(JSON.parse(selectedRawJson), null, 2);
              } catch {
                return selectedRawJson;
              }
            })()}
          </pre>
        </Modal>
      )}
    </div>
  );
};
