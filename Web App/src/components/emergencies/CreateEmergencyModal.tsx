import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useEmergencyStore } from '../../store/emergencyStore';
import { emergencyApi } from '../../api/emergencies';
import type { IncidentSource } from '../../types';
import { AlertTriangle, Watch, Smartphone, MapPin, Activity, Zap } from 'lucide-react';

interface CreateEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateEmergencyModal: React.FC<CreateEmergencyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { fetchActiveIncidents } = useEmergencyStore();
  const [source, setSource] = useState<IncidentSource>('SMARTWATCH_AUTO');
  const [detectionReason, setDetectionReason] = useState(
    'High Impact Fall with 15s Post-Impact Stillness'
  );
  const [latitude, setLatitude] = useState(16.3533);
  const [longitude, setLongitude] = useState(80.5238);
  const [peakG, setPeakG] = useState(3.65);
  const [gyroDps, setGyroDps] = useState(410);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload: any = {
        source,
        latitude,
        longitude,
        accuracyMeters: 4.2,
        detectionReason,
        detectionScore: source === 'SMARTWATCH_AUTO' ? 0.94 : 1.0,
      };

      if (source === 'SMARTWATCH_AUTO') {
        payload.detectionEvent = {
          eventType: 'FALL_IMPACT',
          accelerationMagnitude: peakG,
          angularVelocity: gyroDps / 57.3, // convert to rad/s
          postImpactInactivitySec: 15,
          rawTelemetryJson: JSON.stringify({
            accel_peak_g: peakG,
            gyro_dps: gyroDps,
            inactivity_sec: 15,
            impact_axis: 'Z-Y',
            device_model: 'VVIT-WearOS-Round-Watch',
          }),
        };
      }

      await emergencyApi.createIncident(payload);
      await fetchActiveIncidents();

      setFeedback('Emergency alert successfully dispatched to network!');
      setTimeout(() => {
        setIsSubmitting(false);
        setFeedback(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to create emergency:', err);
      setFeedback('Error: ' + (err.message || 'Failed to dispatch'));
      setIsSubmitting(false);
    }
  };

  const setPresetLocation = (name: string, lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispatch Emergency Incident (Live Network Simulation)"
      subtitle="Creates a real incident in the backend and triggers live SSE alert broadcast"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
            Trigger Source
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setSource('SMARTWATCH_AUTO');
                setDetectionReason('High Impact Fall with 15s Post-Impact Stillness');
              }}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                source === 'SMARTWATCH_AUTO'
                  ? 'border-red-500 bg-red-950/40 text-white'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Watch className="h-5 w-5 text-rose-400" />
              <div>
                <p className="text-xs font-bold text-white">Smartwatch Fall</p>
                <p className="text-[11px] text-slate-400">IMU Sensor Trigger (50Hz)</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSource('MOBILE_SOS');
                setDetectionReason('Manual User SOS Activated from Phone');
              }}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                source === 'MOBILE_SOS'
                  ? 'border-orange-500 bg-orange-950/40 text-white'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Smartphone className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-xs font-bold text-white">Mobile SOS</p>
                <p className="text-[11px] text-slate-400">App Button or 5x Power Tap</p>
              </div>
            </button>
          </div>
        </div>

        {/* Reason / Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Detection Reason / Situation
          </label>
          <input
            type="text"
            value={detectionReason}
            onChange={(e) => setDetectionReason(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-red-500 focus:outline-none"
            required
          />
        </div>

        {/* Smartwatch IMU Telemetry Fields if Smartwatch */}
        {source === 'SMARTWATCH_AUTO' && (
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
              <Activity className="h-4 w-4" />
              <span>Smartwatch IMU Sensor Telemetry</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Peak Acceleration G-Force: <span className="font-bold text-white">{peakG} G</span>
                </label>
                <input
                  type="range"
                  min="2.0"
                  max="6.0"
                  step="0.05"
                  value={peakG}
                  onChange={(e) => setPeakG(parseFloat(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Rotational Speed: <span className="font-bold text-white">{gyroDps} °/s</span>
                </label>
                <input
                  type="range"
                  min="200"
                  max="800"
                  step="10"
                  value={gyroDps}
                  onChange={(e) => setGyroDps(parseInt(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Coordinates */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-red-400" />
              GPS Coordinates (Latitude, Longitude)
            </label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPresetLocation('VVIT Campus', 16.3533, 80.5238)}
                className="text-[10px] text-red-400 hover:underline"
              >
                VVIT Campus
              </button>
              <span className="text-[10px] text-slate-600">·</span>
              <button
                type="button"
                onClick={() => setPresetLocation('AIIMS Mangalagiri', 16.4357, 80.5644)}
                className="text-[10px] text-sky-400 hover:underline"
              >
                AIIMS NH16
              </button>
              <span className="text-[10px] text-slate-600">·</span>
              <button
                type="button"
                onClick={() => setPresetLocation('GGH Guntur', 16.3067, 80.4365)}
                className="text-[10px] text-emerald-400 hover:underline"
              >
                GGH Guntur
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="0.0001"
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value))}
              placeholder="Latitude"
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
              required
            />
            <input
              type="number"
              step="0.0001"
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value))}
              placeholder="Longitude"
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {feedback && (
          <div
            className={`rounded-xl p-3 text-xs font-semibold ${
              feedback.startsWith('Error')
                ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {feedback}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 active:scale-95 disabled:opacity-50 transition-all"
          >
            <Zap className="h-4 w-4" />
            {isSubmitting ? 'Broadcasting...' : 'Broadcast Emergency'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
